// import {config}  from "./../variables/variables";

export default function handleFinalAction(flutterClient, espClient) {
    // See if there is any object in the frame. i.e. perform distance estimation
    // If there is any object, store the distance
    sendControlMessageToFlutter('Started the Final Action Process', flutterClient);
    sendControlMessageToFlutter('Starting Camera', flutterClient);
    // Start the camera
    const camsStarted = startCameras();
    if (!camsStarted) {
        sendControlMessageToFlutter('Camera Could Not Be Started', flutterClient);
        return;
    }
    else {
        sendControlMessageToFlutter('Camera Started', flutterClient);
    }

    // Check if there is any object in the frame
    [obj1, obj2] = checkObjectPresence();
    if (obj1 === null && obj2 === null) {
        sendControlMessageToFlutter('No Object Detected at the position', flutterClient);
        // Rotate the head by 10 degrees
        // Perform distance estimation
    }
    else {
        sendControlMessageToFlutter('Object Detected', flutterClient);
    }

    // If there is no object, rotate the head by 10 degrees and perform distance estimation
    // If there is any object, store the distance
}

function sendControlMessageToFlutter(message, flutterClient) {
    const response = {
        'type': 'control_info',
        'message': message,
    };
    flutterClient.forEach((element) => {
        element.send(JSON.stringify(response));
    });
}

function startCameras() {
    // Start the camera
    stereoCam.startProcess(1, frameStream1);
    stereoCam.startProcess(2, frameStream2);

    // Check if the camera is started
    let intervalFunc = setInterval(async () => {
        if (config.stream1Status === null && config.stream2Status === null) {
            sendControlMessageToFlutter('Waiting for camera to get started', flutterClient);
        }
        else if (config.stream1Status && config.stream2Status) {
            clearInterval(intervalFunc);
            return true;
        } else if (!config.stream1Status || !config.stream2Status) {
            clearInterval(intervalFunc);
            config.stream1Status = null;
            config.stream2Status = null;
            sendControlMessageToFlutter('Camera Could Not Be Started', flutterClient);
            return false;
        }
    }, 500);

}

function checkObjectPresence() {
    config.determineObjectPresence1 = true;
    config.determineObjectPresence2 = true;
    let intervalFunc = setInterval(async () => {
        if (!config.determineObjectPresence1 && !config.determineObjectPresence2) {
            sendControlMessageToFlutter('Waiting for object to be detected', flutterClient);
            clearInterval(intervalFunc);
        }
    }, 500);
    return [config.object1Present, config.object2Present];
}