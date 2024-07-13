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

let buffer1, buffer2;
let showBoundingBoxes = false;

let stream1Status;
let stream2Status;

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
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`);
        res.write(data);
        res.write('\r\n');
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
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`);
        res.write(data);
        res.write('\r\n');
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
            console.log('Hello1');
            buffer1 = data;
            if (!showBoundingBoxes) {
                outputStream1.write(data);
            } else {
                result = await YOLO.getBoundingBoxes(data);
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
        } catch (err) {
            console.error('Error processing frame1:', err.message);
        }
    });
    frameStream1.on('close', () => { console.log('Frame1 Stream Closed') })




    frameStream2.on('data', async (data) => {
        try {
            console.log('Hello2');
            buffer2 = data;
            if (!showBoundingBoxes) {
                outputStream2.write(data);
            } else {
                result = await YOLO.getBoundingBoxes(data);
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
    x = box[0]
    y = box[1]
    width = box[2]
    height = box[3]
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
    drawLine(x, y, x + width, y);
    drawLine(x, y + height, x + width, y + height);
    // Left and right edges
    drawLine(x, y, x, y + height);
    drawLine(x + width, y, x + width, y + height);

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

    const timestamp = Date.now();
    // fs.writeFileSync(`frames/img${timestamp}.png`, buffer);
    // Save the image to a file
    // image.write(`frames/img${timestamp}.png`, (err) => {
    //     if (err) throw err;
    //     console.log('Image created successfully!');
    // });
    return image;
    // console.log(typeof image)
}