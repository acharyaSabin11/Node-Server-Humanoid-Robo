const express = require('express');
const stereoCam = require('./../stereo-cam/stereoCam')
const router = express.Router();
const { stream1, stream2 } = require('./../passthroughs/outputPassthrough');
const { frameStream1, frameStream2 } = require('./../passthroughs/mainPassthrough');
const { updateFirstDistance, updateSecondDistance, saveBoundingBoxesUpdater, passthroughUpdater, distanceSelector, config, jsonObj, firstImages, secondImages, firstBBs, secondBBs, clearBBs } = require('./../variables/variables');
const fs = require('fs');
const { N, dc } = require('./../variables/constants');
const { calcDistance, avgCenterCalculator } = require('./../stereo-cam/utilities');
const YOLO = require('./../yolo/node-files/yolo-processing');
// const { callibrationStream1, callibrationStream2 } = require('./../passthroughs/callibationPassthrough');


let stream1Status;
let stream2Status;
const distanceMap = [];

const filePath = './frames/rawCallibration.json'

//Dataset Generation OR Saving the images to a file.
router.post('/save', (req, res) => {
    console.log(req.body);
    if (req.body.save === true) {
        passthroughUpdater('save');
    } else if (req.body.save === false) {
        passthroughUpdater('output');
    }
    res.setHeader('Content-Type', 'applicaton/json');
    res.send({ status: req.body.save });
})

//Handling the request in callibration end point.
router.post('/callibration', (req, res) => {
    body = req.body;
    console.log(body);
    // Diverting the image stream to the callibration stream.
    passthroughUpdater('callibration');
    //response is sent from this function only.
    callibrateAndSaveBoundingBoxes(body, res);
    passthroughUpdater('output');
})


router.get('/distance', async (req, res, next) => {
    // console.log('Distance Received');
    config.calculateDistance = true;
    let intervalFunc = setInterval(async () => {
        console.log('Checking');
        if (config.bothStreamDistanceBoundingBoxesCalculated) {
            let present = false;
            let distance = 0;
            console.log('Confidence1', firstBBs[0]?.prob);
            console.log('Confidence2', secondBBs[0]?.prob);
            distance = calcDistance(firstBBs, secondBBs);
            console.log(firstBBs.length);
            //Clearing the Buffers
            firstBBs.splice(0, firstBBs.length);
            secondBBs.splice(0, secondBBs.length);
            console.log(firstBBs.length);
            if (distance > 0) {
                present = true;
            }
            res.setHeader('Content-Type', 'application/json');
            res.send({ "Distance": distance, "Object": present });
            clearInterval(intervalFunc);
        }
    }, 500);

})


router.post('/', async (req, res, next) => {
    body = req.body;
    console.log(body);
    if (req.body.streaming === 'start') {
        stereoCam.startProcess(1, frameStream1);
        stereoCam.startProcess(2, frameStream2);
        stream1Status = true;
        stream2Status = true;
    }
    else if (req.body.streaming === 'stop') {
        stereoCam.stopProcess(1);
        stereoCam.stopProcess(2);
        stream1Status = false;
        stream2Status = false;
    }
    if (!(req.body.showBoundingBoxes === null)) {
        config.showBoundingBoxes = req.body.showBoundingBoxes;
    }
    res.setHeader('Content-Type', 'application/json')
    const statusObj = {
        'Stream1': stream1Status,
        'Stream2': stream2Status,
        'boundingBoxStatus': config.showBoundingBoxes,
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

    stream1.on('data', async (data) => {
        buf = Buffer.concat([Buffer.from(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`), data, Buffer.from('\r\n')])
        res.write(buf);
    });

    req.on('close', () => {
        stream1.removeAllListeners('data');
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

    stream2.on('data', async (data) => {
        buf = Buffer.concat([Buffer.from(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${data.length}\r\n\r\n`), data, Buffer.from('\r\n')])
        res.write(buf);
    });

    req.on('close', () => {
        stream2.removeAllListeners('data');
        console.log('Stream Closed');
    });
});

//? *******************************************************Helper Functions******************************************************************************
function clearJson() {
    Object.keys(jsonObj).forEach(key => delete jsonObj[key]);
}

//Callibrate and save boundingboxes
function callibrateAndSaveBoundingBoxes(body, res) {
    // Performing Actions based on the request from the mobile app.
    if (body.firstDistance) {
        // Configures the callibration channel to save and select the first distances bounding boxes.
        updateFirstDistance(body.firstDistance);
        distanceSelector(1);
        saveBoundingBoxesUpdater(true);
        const intervalFunc = setInterval(() => {
            console.log('Checking');
            // console.log(firstImages);
            // console.log(secondImages);
            if (config.bothStreamBoundingBoxesCalculated) {
                clearJson();
                jsonObj.callibrationDistance1 = body.firstDistance;
                jsonObj.boundingBoxes1 = {
                    'cam-left': [...firstImages],
                    'cam-right': [...secondImages],
                }
                fs.writeFileSync(filePath, JSON.stringify(jsonObj));
                //clearing images bounding box for next time.
                firstImages.splice(0, firstImages.length);
                secondImages.splice(0, secondImages.length);
                res.setHeader('Content-Type', 'application/json');
                res.send({ 'status': 'success' });
                config.bothStreamBoundingBoxesCalculated = false;
                passthroughUpdater('output');
                clearInterval(intervalFunc);
            }
        }, 500);

    } else if (body.secondDistance) {
        // Configures the callibration channel to save and select the second distances bounding boxes.
        updateSecondDistance(body.secondDistance);
        distanceSelector(2);
        saveBoundingBoxesUpdater(true);

        const intervalFunc = setInterval(() => {
            if (config.bothStreamBoundingBoxesCalculated) {
                jsonObj.callibrationDistance2 = body.secondDistance;
                jsonObj.boundingBoxes2 = {
                    'cam-left': [...firstImages],
                    'cam-right': [...secondImages],
                }
                console.log(firstImages.length)
                fs.writeFileSync(filePath, JSON.stringify(jsonObj));
                //clearing images bounding box for next time.
                firstImages.splice(0, firstImages.length);
                secondImages.splice(0, secondImages.length);
                console.log(firstImages.length)
                res.setHeader('Content-Type', 'application/json');
                res.send({ 'status': 'success' });
                config.bothStreamBoundingBoxesCalculated = false;
                passthroughUpdater('output');
                clearInterval(intervalFunc);
            }
        }, 500);
    } else if (body.callibrate) {
        //Callibrate and save distances.
        let d1 = jsonObj.callibrationDistance1;
        let d2 = jsonObj.callibrationDistance2;
        console.log('Distance1:', d1);
        console.log('Distance2:', d2);
        let avgCenterLeft1 = avgCenterCalculator(jsonObj.boundingBoxes1['cam-left']);
        let avgCenterRight1 = avgCenterCalculator(jsonObj.boundingBoxes1['cam-right']);
        console.log('AvgCenterLeft1:', avgCenterLeft1);
        console.log('AvgCenterRight1:', avgCenterRight1);
        let p1 = Math.abs(avgCenterLeft1 - avgCenterRight1);
        let avgCenterLeft2 = avgCenterCalculator(jsonObj.boundingBoxes2['cam-left']);
        let avgCenterRight2 = avgCenterCalculator(jsonObj.boundingBoxes2['cam-right']);
        console.log('AvgCenterLeft2:', avgCenterLeft2);
        console.log('AvgCenterRight2:', avgCenterRight2);
        let p2 = Math.abs(avgCenterLeft2 - avgCenterRight2);

        console.log('P1:', p1);
        console.log('P2:', p2);
        console.log('N:', N);
        console.log('dc:', dc);
        let callibratedJson = {}
        if (p1 != 0 && p2 != 0) {
            let tantheta = ((N * dc) / (2 * (d1 - d2))) * (1 / p1 - 1 / p2);
            console.log('TanTheta:', tantheta);
            let focal = d1 - (N * dc) / (2 * p1 * tantheta);
            console.log('focal', focal);

            callibratedJson = {
                'tantheta': tantheta,
                'focal-length': focal,
                'status': 'success'
            }
            fs.writeFileSync('./frames/callibrated.json', JSON.stringify(callibratedJson));
        }
        else {
            callibratedJson = {
                'status': 'Failed Callibration'
            }
        }


        res.setHeader('Content-Type', 'application/json');
        res.send(callibratedJson);
        passthroughUpdater('output');

    }
}
//? *******************************************************Helper Functions******************************************************************************

module.exports = router;

