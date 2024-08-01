const express = require('express');
const stereoCam = require('./../stereo-cam/stereoCam')
const router = express.Router();
const YOLO = require('../yolo/node-files/yolo-processing');
const { PassThrough } = require('stream');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const Jimp = require('jimp');

let frameStream1 = new PassThrough();
let frameStream2 = new PassThrough();
let outputStream1 = new PassThrough();
let outputStream2 = new PassThrough();
defineHandlers();

const filePath = './frames/frames_info.txt'

//? Only required for saving images.
//Defining frame directory path
const frameDir = './frames'
// Ensure frame directory exists
if (!fs.existsSync(frameDir)) {
    fs.mkdirSync(frameDir);
}
let frameNumber1 = 0;
let frameNumber2 = 0;

let buffer1, buffer2;
let showBoundingBoxes = false;

let stream1Status;
let stream2Status;

router.get('/distance', async (req, res, next) => {
    let image1;
    let image2;
    let boundingBoxes1 = [];
    let boundingBoxes2 = [];
    let present = false;
    // TAKING AVERAGE FROM 5 IMAGE FRAMES
    for (let i = 0; i < 5; i++) {
        image1 = buffer1;
        image2 = buffer2;
        let bb1 = await YOLO.getBoundingBoxes(image1);
        let bb2 = await YOLO.getBoundingBoxes(image2);
        if (bb1.isEmpty || bb2.isEmpty) {
            continue;
        }
        boundingBoxes1.push(bb1);
        boundingBoxes2.push(bb2);
    }

    if (!(boundingBoxes1.isEmpty || boundingBoxes2.isEmpty)) {
        present = true;
    }

    const distance = calcDistance(boundingBoxes1, boundingBoxes2);
    res.setHeader('Content-Type', 'application/json')
    res.send({ "Distance": distance, "Object": present })
})


router.post('/', async (req, res, next) => {
    body = req.body;
    console.log(body);
    if (req.body.streaming === 'start') {
        // frameStream1 = new PassThrough();
        // frameStream2 = new PassThrough();
        // outputStream1 = new PassThrough();
        // outputStream2 = new PassThrough();
        stereoCam.startProcess(2, frameStream2);
        stereoCam.startProcess(1, frameStream1);
        stream1Status = true;
        stream2Status = true;
    }
    else if (req.body.streaming === 'stop') {
        stereoCam.stopProcess(2);
        stereoCam.stopProcess(1);
        stream1Status = false;
        stream2Status = false;
    }
    if (!(req.body.showBoundingBoxes === null)) {
        showBoundingBoxes = req.body.showBoundingBoxes;
    }
    res.setHeader('Content-Type', 'aplication/json')
    const statusObj = {
        'Stream1': stream1Status,
        'Stream2': stream2Status,
        'boundingBoxStatus': showBoundingBoxes,
    }
    res.send(statusObj);

});

router.get('/stream1', async (req, res, next) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
    });

    outputStream1.on('data', async (data) => {
        buf = Buffer.concat([Buffer.from(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`), data, Buffer.from('\r\n')])
        res.write(buf);
        // res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`);
        // res.write(data);
        // res.write('\r\n');
        // console.log(data[0]);
        // console.log(data[1]);
        // console.log(data[data.length - 2]);
        // console.log(data[data.length - 1]);
        // res.write(data);
    });

    req.on('close', () => {
        outputStream1.removeAllListeners('data');
        console.log('Stream Closed');
    });
});

router.get('/stream2', async (req, res, next) => {

    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
    });

    outputStream2.on('data', async (data) => {
        buf = Buffer.concat([Buffer.from(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`), data, Buffer.from('\r\n')])
        res.write(buf);
    });

    req.on('close', () => {
        outputStream2.removeAllListeners('data');
        console.log('Stream Closed');
    });
});

// Define module framestampipeline handlers
function defineHandlers() {
    frameStream1.on('data', async (data) => {
        try {
            // Code for streaming
            console.log('Frame 1 Received');
            buffer1 = data;
            if (!showBoundingBoxes) {
                outputStream1.write(data);
            } else {
                result = await YOLO.getBoundingBoxes(data);
                // fs.appendFile(filePath, `Frame Stream 1 Bounding Box: ${result.toString()}\n`);
                if (result.length === 0) {
                    outputStream1.write(data);
                } else {
                    const image = await createBoundingBoxes(data, result);
                    image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                        if (err) {
                            console.error(err);
                        }
                        outputStream1.write(buffer);
                    });
                }
            }

            // // Code to save the streamed image
            // frameNumber1++;
            // const image = await Jimp.read(data);
            // // console.log('Processed frame:', image.bitmap.width, 'x', image.bitmap.height);
            // // console.log(typeof image)
            // // Save the image to a file
            // const fileName = `${frameDir}/left_${frameNumber1}.jpg`;
            // image.write(fileName);
            // console.log('Saved frame:', fileName);
        } catch (err) {
            console.error('Error processing frame1:', err.message);
        }
    });
    frameStream1.on('close', () => { console.log('Frame1 Stream Closed') })




    frameStream2.on('data', async (data) => {
        try {
            // Code for streaming
            console.log('Frame 2 Received');
            buffer2 = data;
            if (!showBoundingBoxes) {
                outputStream2.write(data);
            } else {
                result = await YOLO.getBoundingBoxes(data);
                // fs.appendFile(filePath, `Frame Stream 2 Bounding Box: ${result.toString()}\n`);
                if (result.length === 0 || showBoundingBoxes === false) {
                    outputStream2.write(data);
                } else {
                    const image = await createBoundingBoxes(data, result);
                    image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                        if (err) {
                            console.error(err);
                        }
                        outputStream2.write(buffer);
                    });
                }
            }

            // // Code to save the streamed image
            // frameNumber2++;
            // const image = await Jimp.read(data);
            // // console.log('Processed frame:', image.bitmap.width, 'x', image.bitmap.height);
            // // console.log(typeof image)
            // // Save the image to a file
            // const fileName = `${frameDir}/right_${frameNumber2}.jpg`;
            // image.write(fileName);
            // console.log('Saved frame:', fileName);

        } catch (err) {
            console.error('Error processing frame2:', err.message);
        }
    });
    frameStream2.on('close', () => { console.log('Frame2 Stream Closed') })
}

module.exports = router;



// Code to save the streamed image
// frameNumber++;
// const image = await Jimp.read(data);
// console.log('Processed frame:', image.bitmap.width, 'x', image.bitmap.height);
// console.log(typeof image)
// Save the image to a file
// const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '');
// const fileName = `${frameDir}/right_${frameNumber}.jpg`;
// await image.write(fileName);
// console.log('Saved frame:', fileName);

async function createBoundingBoxes(imageData, boundingBoxes) {
    const image = await Jimp.read(imageData);
    box = boundingBoxes[0];
    // image.scan(box[0], box[1], box[2], box[3], function (x, y, idx) {
    //     this.bitmap.data[idx] = 255;     // Red
    //     this.bitmap.data[idx + 1] = 0;   // Green
    //     this.bitmap.data[idx + 2] = 0;   // Blue
    //     this.bitmap.data[idx + 3] = 255; // Alpha
    // });

    const boxColor = Jimp.cssColorToHex('#00FF00');
    x1 = box[0]
    y1 = box[1]
    x2 = box[2]
    y2 = box[3]
    label = box[4]
    probability = box[5]
    const drawLine = (x1, y1, x2, y2) => {
        for (let i = 0; i <= Math.max(x2 - x1, y2 - y1); i++) {
            const nx = x1 + i * (x2 - x1) / Math.max(x2 - x1, y2 - y1);
            const ny = y1 + i * (y2 - y1) / Math.max(x2 - x1, y2 - y1);
            image.setPixelColor(boxColor, nx, ny);
        }
    };
    // Top and bottom edges
    drawLine(x1, y1, x2, y1);
    drawLine(x1, y1, x1, y2);
    drawLine(x2, y1, x2, y2);
    drawLine(x1, y2, x2, y2);

    // // Load a font
    // Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(font => {
    //     // Draw the label and probability
    //     image.print(font, x, y - 20, `${label} (${probability})`);

    //     // Save the image to a file
    //     image.write('path/to/output.jpg', err => {
    //         if (err) throw err;
    //         console.log('Image created successfully!');
    //     });
    // });

    // const timestamp = Date.now();
    // fs.writeFileSync(`frames/img${timestamp}.png`, buffer);
    // Save the image to a file
    // image.write(`frames/img${timestamp}.png`, (err) => {
    //     if (err) throw err;
    //     console.log('Image created successfully!');
    // });
    return image;
    // console.log(typeof image)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calcDistance(boundingBoxes1, boundingBoxes2) {
    const f = 3 //need to update this later
    const tanTheta = 0.4 //need to update this later
    let iteration = boundingBoxes1.length
    let sumDistances = 0;   //sums the distance for each 5 different distances and to take average at last.
    const N = 480   // Width of Full Image in Pixels
    const Ds = 4.75 // Distance between separation of two cameras(in cm)
    let distance = 0;
    for (let i = 0; i < iteration; i++) {
        let box1 = boundingBoxes1[i];
        let box2 = boundingBoxes2[i];

        let pixelShift1 = [box1[0] - box2[0]]
        let pixelShift2 = [box1[2] - box2[2]]

        let p = (pixelShift1 + pixelShift2) / 2

        distance = f + (N * Dc) / (2 * p * tanTheta)
        sumDistances += distance;
    }

    distance = sumDistances / iteration
    return distance
}