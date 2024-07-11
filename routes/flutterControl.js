const express = require('express');
const stereoCam = require('./../stereo-cam/stereoCam')
const router = express.Router();
const YOLO = require('../yolo/node-files/yolo-processing');
const { PassThrough } = require('stream');
const fs = require('fs');

let frameStream1 = new PassThrough();
let frameStream2 = new PassThrough();
defineHandlers();

const filePath = './frames/frames_info.txt'

let buffer1, buffer2;

router.post('/', async (req, res, next) => {
    body = req.body;
    console.log(body);
    if (req.body.streaming === 'start') {
        stereoCam.startProcess(2, frameStream2);
        stereoCam.startProcess(1, frameStream1);
        res.send('Stream Started Successfully');
    }
    else if (req.body.streaming === 'stop') {
        stereoCam.stopProcess(2);
        stereoCam.stopProcess(1);
        res.send('Streaming Closed Successfully');
    } else {
        res.send('Invalid');
    }
    // console.log(stereoCam.ffmpegProcess1);
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Define module framestampipeline handlers
function defineHandlers() {
    frameStream1.on('data', async (data) => {
        try {
            buffer1 = data;
            result = await YOLO.getBoundingBoxes(buffer1)
            console.log(typeof result);
            data = 'Frame1:' + result.toString();
            fs.appendFile(filePath, data, (err) => { if (err) { console.error(err) } });
        } catch (err) {
            console.error('Error processing frame1:', err.message);
        }
    });
    frameStream1.on('close', () => { console.log('Frame1 Stream Closed') })





    frameStream2.on('data', async (data) => {
        try {
            buffer2 = data;
            result = await YOLO.getBoundingBoxes(buffer2)
            console.log(typeof result);
            data = 'Frame2:' + result.toString();
            console.log(data);
            fs.appendFile(filePath, data, (err) => { if (err) { console.error(err) } });
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