const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp'); //for image creation for 
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { PassThrough } = require('stream');


//Urls where the video is being hosted by the ESP32-CAM server.
const videoUrl1 = 'http://192.168.254.14:81/stream';
const videoUrl2 = 'http://192.168.254.15:81/stream';


const frameRate = 10; // Extract 20 frame per second

let ffmpegProcess1, ffmpegProcess2;

ffmpeg.setFfmpegPath(ffmpegPath);


function startProcess(processnumber, frameSreamPipeline) {
    if (processnumber === 1) {
        startStreaming1(frameSreamPipeline);
    }
    else if (processnumber === 2) {
        startStreaming2(frameSreamPipeline);
    }
}

function stopProcess(processnumber) {
    if (processnumber === 1) {
        stopStreaming1();
    }
    else if (processnumber === 2) {
        stopStreaming2();
    }
}

function startStreaming1(frameSreamPipeline) {

    if (ffmpegProcess1) {
        console.log('FFmpeg process is already running');
        return;
    }
    ffmpegProcess1 = ffmpeg(videoUrl1)
        .on('start', () => {
            console.log('FFmpeg process started');
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr form proc 1:', stderrLine);
        })
        .on('error', (err) => {
            console.error('An error occurred:', err.message);
            ffmpegProcess1 = null;
        })
        .on('end', () => {
            console.log('FFmpeg process ended');
            ffmpegProcess1 = null;
        })
        .outputOptions([
            `-vf fps=${frameRate}`,
            '-f image2pipe',
            '-vcodec mjpeg'
        ]);

    ffmpegProcess1.pipe(frameSreamPipeline);
}

function startStreaming2(frameSreamPipeline) {
    frameStream2 = new PassThrough();
    if (ffmpegProcess2) {
        console.log('FFmpeg process is already running');
        return;
    }

    ffmpegProcess2 = ffmpeg(videoUrl2)
        .on('start', () => {
            console.log('FFmpeg process started');
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr from proc 2:', stderrLine);
        })
        .on('error', (err) => {
            console.error('An error occurred:', err.message);
            ffmpegProcess2 = null;
        })
        .on('end', () => {
            console.log('FFmpeg process ended');
            ffmpegProcess2 = null;
        }).outputOptions([
            `-vf fps=${frameRate}`,
            '-f image2pipe',
            '-vcodec mjpeg'
        ]);

    ffmpegProcess2.pipe(frameSreamPipeline);

    // .outputOptions([
    //     `-vf fps=${frameRate}`,
    //     `-qscale:v 2`
    // ])
    // .output(path.join(frameDir, `Proc2-%04d.jpg`))
    // .run();



}

function stopStreaming1() {
    if (ffmpegProcess1) {
        ffmpegProcess1.kill('SIGKILL');
        console.log('FFmpeg process stopped');
        ffmpegProcess1 = null;
    } else {
        console.log('No FFmpeg process is running');
    }
}

function stopStreaming2() {
    if (ffmpegProcess2) {
        ffmpegProcess2.kill('SIGKILL');
        console.log('FFmpeg process stopped');
        ffmpegProcess2 = null;
    } else {
        console.log('No FFmpeg process is running');
    }
}

module.exports = {
    startProcess,
    stopProcess,
    ffmpegProcess1,
    ffmpegProcess2,
    videoUrl1,
    videoUrl2,
}