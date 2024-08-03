const { PassThrough } = require('stream');
const fs = require('fs');
const Jimp = require('jimp');

let saveImageStream1 = new PassThrough();
let saveImageStream2 = new PassThrough();


//Defining frame directory path
const frameDir = './frames'
// Ensure frame directory exists
if (!fs.existsSync(frameDir)) {
    fs.mkdirSync(frameDir);
}

let frameNumber1 = 0;
let frameNumber2 = 0;

//* ********************************************Defining Listeners for Passthroughs*******************************************************************
saveImageStream1.on('data', async (data) => {
    try {
        // Code to save the streamed image
        frameNumber1++;
        const image = await Jimp.read(data);
        // Save the image to a file
        const fileName = `${frameDir}/left_${frameNumber1}.jpg`;
        image.write(fileName);
        console.log('Saved frame:', fileName);
    } catch (err) {
        console.error('Error processing frame1:', err.message);
    }
});
saveImageStream1.on('close', () => { console.log('Save Image Stream 1 Closed') })

saveImageStream2.on('data', async (data) => {
    try {
        // Code to save the streamed image
        frameNumber2++;
        const image = await Jimp.read(data);
        // Save the image to a file
        const fileName = `${frameDir}/right_${frameNumber2}.jpg`;
        image.write(fileName);
        console.log('Saved frame:', fileName);
    } catch (err) {
        console.error('Error processing frame2:', err.message);
    }
});
saveImageStream2.on('close', () => { console.log('Save Image Stream 2 Closed') })


//* ********************************************Defining Listeners for Passthroughs*******************************************************************

module.exports = {
    saveImageStream1,
    saveImageStream2,
}