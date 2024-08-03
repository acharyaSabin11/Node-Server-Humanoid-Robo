const { PassThrough } = require('stream');
const Jimp = require('jimp');
const YOLO = require('../yolo/node-files/yolo-processing');
const { showBoundingBoxes } = require('./../variables/variables');


let outputStream1 = new PassThrough();
let outputStream2 = new PassThrough();
let stream1 = new PassThrough();
let stream2 = new PassThrough();

let buffer1, buffer2;

//* ********************************************Defining Listeners for Passthroughs*******************************************************************
outputStream1.on('data', async (data) => {
    try {
        buffer1 = data;
        if (!showBoundingBoxes) {
            stream1.write(data);
        } else {
            result = await YOLO.getBoundingBoxes(data);
            // fs.appendFile(filePath, `Frame Stream 1 Bounding Box: ${result.toString()}\n`);
            if (result.length === 0) {
                stream1.write(data);
            } else {
                const image = await createBoundingBoxes(data, result);
                image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                    if (err) {
                        console.error(err);
                    }
                    stream1.write(buffer);
                });
            }
        }
    } catch (err) {
        console.error('Error processing frame1:', err.message);
    }
});
outputStream1.on('close', () => { console.log('Output Stream 1 Closed') })




outputStream2.on('data', async (data) => {
    try {
        buffer2 = data;
        if (!showBoundingBoxes) {
            stream2.write(data);
        } else {
            result = await YOLO.getBoundingBoxes(data);
            // fs.appendFile(filePath, `Frame Stream 2 Bounding Box: ${result.toString()}\n`);
            if (result.length === 0 || showBoundingBoxes === false) {
                stream2.write(data);
            } else {
                const image = await createBoundingBoxes(data, result);
                image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                    if (err) {
                        console.error(err);
                    }
                    stream2.write(buffer);
                });
            }
        }
    } catch (err) {
        console.error('Error processing frame2:', err.message);
    }
});
outputStream2.on('close', () => { console.log('Output Stream 2 Closed') })


//* ********************************************Defining Listeners for Passthroughs*******************************************************************


//? ********************************************Helper Functions***************************************************************************************
async function createBoundingBoxes(imageData, boundingBoxes) {
    const image = await Jimp.read(imageData);
    box = boundingBoxes[0];

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

    return image;
}

//? ********************************************Helper Functions***************************************************************************************

module.exports = {
    outputStream1,
    outputStream2,
    stream1,
    stream2,
}