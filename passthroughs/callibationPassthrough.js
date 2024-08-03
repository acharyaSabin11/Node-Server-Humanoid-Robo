const { PassThrough } = require('stream');
const { config, saveBoundingBoxesUpdater, firstImages, secondImages } = require('./../variables/variables');
const YOLO = require('./../yolo/node-files/yolo-processing');

let callibrationStream1 = new PassThrough();
let callibrationStream2 = new PassThrough();

let counter1 = 0;
let counter2 = 0;

//* ********************************************Defining Listeners for Passthroughs*******************************************************************
callibrationStream1.on('data', async (data) => {
    // Return immediately if the save bounding boxes option is not enabled.
    if (!config.saveBoundingBoxes) return;
    // Calculate and save Bounding Boxes for 5 Images.
    if (counter1 < 5) {
        counter1++;
        console.log(counter1);
        console.log('Calculating Bounding Boxes 1');
        let BB = await YOLO.getBoundingBoxes(data);
        BB = BB[0];
        if (!BB) {
            firstImages.push({ x1: 0, y1: 0, x2: 0, y2: 0, prob: 0, label: 'No Object' })
        }
        else {
            firstImages.push({ x1: BB[0] ?? 0, y1: BB[1] ?? 0, x2: BB[2] ?? 0, y2: BB[3] ?? 0, prob: BB[4] ?? 0, label: BB[5] ?? 'No Object' });
        }
    } else {
        // Stop Saving
        reset();
        config.stream1BoundingBoxesCalculated = true;
    }
});
callibrationStream1.on('close', () => { console.log('Callibration Stream 1 Closed') });




callibrationStream2.on('data', async (data) => {
    // Return immediately if the save bounding boxes option is not enabled.
    if (!config.saveBoundingBoxes) return;
    // Calculate and save Bounding Boxes for 5 Images.
    if (counter2 < 5) {
        counter2++;
        console.log(counter2);
        let BB = await YOLO.getBoundingBoxes(data);
        BB = BB[0];
        if (!BB) {
            secondImages.push({ x1: 0, y1: 0, x2: 0, y2: 0, prob: 0, label: 'No Object' })
        }
        else {
            secondImages.push({ x1: BB[0] ?? 0, y1: BB[1] ?? 0, x2: BB[2] ?? 0, y2: BB[3] ?? 0, prob: BB[4] ?? 0, label: BB[5] ?? 'No Object' });
        }
    } else {
        config.stream2BoundingBoxesCalculated = true;
    }
});
callibrationStream2.on('close', () => { console.log('Callibration Stream 2 Closed') });
//* ********************************************Defining Listeners for Passthroughs*******************************************************************


//? ******************************************** Helper Functions ************************************************************************************
function reset() {
    if (config.stream1BoundingBoxesCalculated && config.stream2BoundingBoxesCalculated) {
        saveBoundingBoxesUpdater(false);
        counter1 = 0;
        counter2 = 0;
        config.bothStreamBoundingBoxesCalculated = true;
        config.stream1BoundingBoxesCalculated = false;
        config.stream2BoundingBoxesCalculated = false;
    }
}
//? ******************************************** Helper Functions ************************************************************************************

module.exports = {
    callibrationStream1,
    callibrationStream2,
}