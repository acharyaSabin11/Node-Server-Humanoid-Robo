// Importing packages
const ort = require("onnxruntime-node");    //For onnx-runtime
const sharp = require("sharp"); //To load uploaded file as an image

async function detect_objects_on_image(buf) {
    const [input, img_width, img_height] = await prepare_input(buf);
    const output = await run_model(input);
    return process_output(output, img_width, img_height);
}

async function prepare_input(buf) {
    const img = sharp(buf); //creating image from buffer data.
    const md = await img.metadata();    //getting metadata info like height, width, etc from the image.
    const [img_width, img_height] = [md.width, md.height];  // storing these information via array desctructuring.
    const pixels = await img.removeAlpha()  // removing alpha(trasparency value) as we require only RGB values.
        .resize({ width: 640, height: 640, fit: 'fill' })   // Resizing the image to 640x640 as required by the yolo model.
        .raw()  // return array as raw array of pixel values.
        .toBuffer();    //make buffer from these pixel values.
    const red = [], green = [], blue = [];  // array to store three different color values
    for (let index = 0; index < pixels.length; index += 3) {    //loading normalized color intensity values to the respective array buffers. First one is Red, second is green and third value is blue so retrieving them sequentially.
        red.push(pixels[index] / 255.0);
        green.push(pixels[index + 1] / 255.0);
        blue.push(pixels[index + 2] / 255.0);
    }
    const input = [...red, ...green, ...blue];  //preparing the array by combining all these 3 color values one by one
    return [input, img_width, img_height];  // return image array along with the metadata information.
}

async function run_model(input) {
    const model = await ort.InferenceSession.create("./yolo/node-files/best.onnx");   // To create the model from the points values(as like from pt values in ultralytics YOLO)
    input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]); //Creating tensor type from the input array as like in python.
    const outputs = await model.run({ images: input }); //Passing the image onto the model for prediction
    return outputs["output0"].data; //returning the output data from the model. return array of dimention (1,5, 8400) which is in js a flat array of size 1*5*8400
}

async function process_output(output, img_width, img_height) {
    function iou(box1, box2) {
        return intersection(box1, box2) / union(box1, box2);
    }

    function union(box1, box2) {
        const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
        const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
        const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
        const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
        return box1_area + box2_area - intersection(box1, box2)
    }

    function intersection(box1, box2) {
        const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
        const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
        const x1 = Math.max(box1_x1, box2_x1);
        const y1 = Math.max(box1_y1, box2_y1);
        const x2 = Math.min(box1_x2, box2_x2);
        const y2 = Math.min(box1_y2, box2_y2);
        return (x2 - x1) * (y2 - y1)
    }

    const yolo_classes = [
        'Coffee-bottle', 'backgrond'
    ];

    boxes = [];
    for (index = 0; index < 8400; index++) {
        const xc = output[8400 * 0 + index];
        const yc = output[8400 * 1 + index];
        const w = output[8400 * 2 + index];
        const h = output[8400 * 3 + index];
        const prob = output[8400 * 4 + index];

        // Resizing back to original image size.
        const x1 = (xc - w / 2) / 640 * img_width;
        const y1 = (yc - h / 2) / 640 * img_height;
        const x2 = (xc + w / 2) / 640 * img_width;
        const y2 = (yc + h / 2) / 640 * img_height;

        let class_id = 0;
        const label = yolo_classes[class_id];
        // boxes.push([x1, y1, x2, y2, label, prob]);
        boxes.push([x1, y1, x2, y2, label, prob]);
        // for (let col = 4; col < 5; col++) {
        //     if (output[8400 * col + index] > prob) {
        //         prob = output[8400 * col + index];
        //         class_id = col - 4;
        //     }
        // }
    }
    boxes = boxes.sort((box1, box2) => box2[5] - box1[5])
    //Setting the confidence to 70 percent.
    boxes = boxes.filter(box => box[5] > 0.60)
    const result = [];
    while (boxes.length > 0) {
        result.push(boxes[0]);
        boxes = boxes.filter(box => iou(boxes[0], box) < 0.7);
    }
    return result;
}

module.exports = {
    getBoundingBoxes: detect_objects_on_image
}
// main()