
const { outputStream1, outputStream2 } = require('./../passthroughs/outputPassthrough');
const { saveImageStream1, saveImageStream2 } = require('./../passthroughs/imageSavePassthrough');
const { callibrationStream1, callibrationStream2, } = require('./../passthroughs/callibationPassthrough');
const { config, frameStream1, frameStream2 } = require('./../variables/variables');




//* ********************************************Defining Listeners for Passthroughs*******************************************************************
frameStream1.on('data', async (data) => {
    switch (config.passthroughSelector) {
        case 'output':
            console.log('output');
            outputStream1.write(data);
            break;
        case 'save':
            console.log('save');
            saveImageStream1.write(data);
            break;
        case 'callibration':
            console.log('callibration');
            callibrationStream1.write(data);
            break;
        default:
            outputStream1.write(data);
            break;
    }
});
frameStream1.on('close', () => { console.log('Frame1 Stream Closed') });


frameStream2.on('data', async (data) => {
    switch (config.passthroughSelector) {
        case 'output':
            outputStream2.write(data);
            break;
        case 'save':
            saveImageStream2.write(data);
            break;
        case 'callibration':
            callibrationStream2.write(data);
            break;
        default:
            outputStream2.write(data);
            break;
    }
});
frameStream2.on('close', () => { console.log('Frame2 Stream Closed') })

//* ********************************************Defining Listeners for Passthroughs*******************************************************************

module.exports = {
    frameStream1,
    frameStream2,
}