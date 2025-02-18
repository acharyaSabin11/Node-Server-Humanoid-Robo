const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { config } = require('./../variables/variables')

//Urls where the video is being hosted by the ESP32-CAM server.
const videoUrl1 = 'http://192.168.254.14:81/stream';
const videoUrl2 = 'http://192.168.254.15:81/stream';



// Two processes to capture the data from 2 ESP32-CAMs.
let ffmpegProcess1, ffmpegProcess2;

// To find the locally installed ffmpeg runtime on the computer. (Make sure it is installed and set up correctly in environment variables)
ffmpeg.setFfmpegPath(ffmpegPath);


//? *****************************************These function will be invoked from other modules***********************************************
// These functions allow to start two streams individually
function startProcess(processnumber, frameSreamPipeline) {
    if (processnumber === 1) {
        startStreaming1(frameSreamPipeline);
    }
    else if (processnumber === 2) {
        startStreaming2(frameSreamPipeline);
    }
}

// These functions allow to stop two streams individually
function stopProcess(processnumber) {
    if (processnumber === 1) {
        stopStreaming1();
    }
    else if (processnumber === 2) {
        stopStreaming2();
    }
}
//? *****************************************These function will be invoked from other modules***********************************************



//* *****************************************These functions are used by the above functions*************************************************
// Function to start first Stream.
function startStreaming1(frameSreamPipeline) {
    //If already running, don't instantiate
    if (ffmpegProcess1) {
        console.log('FFmpeg process is already running');
        return;
    }
    // If not running, instantiate the process.
    ffmpegProcess1 = ffmpeg(videoUrl1)
        .on('start', () => {
            console.log('FFmpeg process started');
        })
        .on('progress', () => {
            config.stream1Status = true;
        })
        .on('stderr', (stderrLine) => {
            // console.log('FFmpeg stderr form proc 1:', stderrLine);
            config.stream1Status = false;
        })
        .on('error', (err) => {
            console.error('An error occurred:', err.message);
            config.stream1Status = false;
            ffmpegProcess1 = null;
        })
        .on('end', () => {
            console.log('FFmpeg process ended');
            config.stream1Status = false;
            ffmpegProcess1 = null;
        })
        .outputOptions([
            `-vf fps=${config.frameRate}`,
            '-f image2pipe',
            '-vcodec mjpeg'
        ]); //Setting framerate for retrieval of images and type of image to be jpeg.

    //Piping the images to the another stream for data manipulation. This pipeline will be provided from the part where the stream is require(here from flutter control router)
    ffmpegProcess1.pipe(frameSreamPipeline, { end: false });    // end : false ; makes the framePipeline not end when ffmpeg process is killed.
}

// Function to start second Stream.
function startStreaming2(frameSreamPipeline) {
    //If already running, don't instantiate
    if (ffmpegProcess2) {
        console.log('FFmpeg process is already running');
        return;
    }
    // If not running, instantiate the process.
    ffmpegProcess2 = ffmpeg(videoUrl2)
        .on('start', () => {
            console.log('FFmpeg process started');
        }).
        on('progress', () => {
            config.stream2Status = true;
        })
        .on('stderr', (stderrLine) => {
            // console.log('FFmpeg stderr from proc 2:', stderrLine);
            config.stream2Status = false;
        })
        .on('error', (err) => {
            console.error('An error occurred:', err.message);
            config.stream2Status = false;
            ffmpegProcess2 = null;
        })
        .on('end', () => {
            console.log('FFmpeg process ended');
            config.stream2Status = false;
            ffmpegProcess2 = null;
        }).outputOptions([
            `-vf fps=${config.frameRate}`,
            '-f image2pipe',
            '-vcodec mjpeg'
        ]); //Setting framerate for retrieval of images and type of image to be jpeg.

    //Piping the images to the another stream for data manipulation. This pipeline will be provided from the part where the stream is require(here from flutter control router)
    ffmpegProcess2.pipe(frameSreamPipeline, { end: false });    // end : false ; makes the framePipeline not end when ffmpeg process is killed.
}

// Function to stop first Stream.
function stopStreaming1() {
    if (ffmpegProcess1) {
        //Kill process and set the process variable to null.
        ffmpegProcess1.kill('SIGKILL');
        console.log('FFmpeg process stopped');
        ffmpegProcess1 = null;
    } else {
        console.log('No FFmpeg process is running');
    }
}

// Function to stop second Stream.
function stopStreaming2() {
    if (ffmpegProcess2) {
        //Kill process and set the process variable to null.
        ffmpegProcess2.kill('SIGKILL');
        console.log('FFmpeg process stopped');
        ffmpegProcess2 = null;
    } else {
        console.log('No FFmpeg process is running');
    }
}
//* *****************************************These functions are used by the above functions*************************************************

module.exports = {
    startProcess,
    stopProcess,
}