const stereoCam = require('./../stereo-cam/stereoCam');
const { config, frameStream1, frameStream2, firstBBs, secondBBs } = require('./../variables/variables');
const { calcDistance } = require('./../stereo-cam/utilities');
const { ForwardWalkingFrameData } = require('./../motionData/ForwardWalking');
const { CounterClockwiseRotationSimulationData } = require('./../motionData/CounterClockwiseRotation');
const { ClockwiseRotationSimulationData } = require('./../motionData/ClockwiseRotationData');
const { LeftSideWalkSimulationData } = require('./../motionData/LeftSideWalking');
const { RightSideWalkSimulationData } = require('./../motionData/RightSideWalking');
const { pickupSimulationData } = require('./../motionData/PickupSimulationData');
const { BackwardWalkingFrameData } = require('./../motionData/BackwardWalking');

async function handleFinalAction(flutterClient, espClient) {
    let headPosition = 90;
    let direction = 1;
    controlHead(headPosition, espClient);
    // See if there is any object in the frame. i.e. perform distance estimation
    // If there is any object, store the distance
    sendControlMessageToFlutter('Started the Final Action Process', flutterClient);
    sendControlMessageToFlutter('Starting Camera', flutterClient);
    // Start the camera
    const camsStarted = await startCameras(flutterClient);
    if (!camsStarted) {
        sendControlMessageToFlutter('Camera Could Not Be Started', flutterClient);
        return;
    }
    else {
        sendControlMessageToFlutter('Camera Started', flutterClient);
    }

    // Check if there is any object in the frame
    let [obj1, obj2] = await checkObjectPresence(flutterClient);
    while (!obj1 && !obj2) {
        const [obj1n, obj2n] = await checkObjectPresence(flutterClient);
        obj1 = obj1n;
        obj2 = obj2n;
        if (!obj1 || !obj2) {
            sendControlMessageToFlutter('No Object Detected at the position', flutterClient);
            console.log(obj1, obj2)
            // Rotate the head by 10 degrees

            headPosition += 10 * direction;

            if (headPosition > 180 || headPosition < 0) {
                direction *= -1;
                headPosition = 90;
                headPosition += 10 * direction;
            }
            controlHead(headPosition, espClient);
            // Perform distance estimation
        }
    }
    headPosition += 5 * direction;
    controlHead(headPosition, espClient);
    config.object1Present = false;
    config.object2Present = false;
    sendControlMessageToFlutter(`Object Detected at head position ${headPosition}`, flutterClient);

    // Rotate the robot towards the object. Use the head position to determine the direction
    sendControlMessageToFlutter('Rotating the robot towards the object', flutterClient);
    if (headPosition > 90) {
        const rotationtimes = Math.floor((headPosition - 90) / 10);
        for (let i = 0; i < rotationtimes; i++) {
            await runMotion('antiClockRotate', flutterClient, espClient);
        }
    }
    else if (headPosition < 90) {
        const rotationtimes = Math.floor((90 - headPosition) / 10);
        for (let i = 0; i < rotationtimes; i++) {
            await runMotion('clockRotate', flutterClient, espClient);
        }
    }
    controlHead(90, espClient);
    const [obj1n, obj2n] = await checkObjectPresence(flutterClient);
    obj1 = obj1n;
    obj2 = obj2n;

    // Now since the object is detected, perform the distance estimation
    sendControlMessageToFlutter(`Attempting Distance Estimation`, flutterClient);
    const distance = await performDistanceEstimation(flutterClient);
    if (!distance) {
        sendControlMessageToFlutter('Distance could not be calculated. Terminating the process.', flutterClient);
        return;
    }

    // If distance is calculated
    sendControlMessageToFlutter(`Object is found at distance: ${distance}`, flutterClient);


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

async function startCameras(flutterClient) {
    // Start the camera
    stereoCam.startProcess(1, frameStream1);
    stereoCam.startProcess(2, frameStream2);

    // Check if the camera is started
    while (config.stream1Status === null || config.stream2Status === null) {
        sendControlMessageToFlutter('Waiting for camera to get started', flutterClient);
        await delay(500);
    }
    if (config.stream1Status && config.stream2Status) {
        return true;
    } else if (!config.stream1Status || !config.stream2Status) {
        config.stream1Status = null;
        config.stream2Status = null;
        return false;
    }


}

async function checkObjectPresence(flutterClient) {
    config.determineObjectPresence1 = true;
    config.determineObjectPresence2 = true;
    while (config.determineObjectPresence1 || config.determineObjectPresence2) {
        sendControlMessageToFlutter('Waiting for object to be detected', flutterClient);
        await delay(500);
    }

    return [config.object1Present, config.object2Present];
}



function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function controlHead(angle, espClient) {
    const response = {
        'type': 'motion-planning',
        'key': 23,
        'value': angle,
    };
    espClient.forEach((element) => {
        element.send(JSON.stringify(response));
    });

}

async function performDistanceEstimation(flutterClient) {
    config.calculateDistance = true;
    while (!config.bothStreamDistanceBoundingBoxesCalculated) {
        sendControlMessageToFlutter('Waiting for bounding boxes to be calculated from both streams', flutterClient);
        await delay(500);
    }
    let distance = 0;
    sendControlMessageToFlutter(`Confidence of first Stream: ${firstBBs[0]?.prob}`, flutterClient);
    console.log('Confidence1', firstBBs[0]?.prob);
    sendControlMessageToFlutter(`Confidence of second Stream: ${secondBBs[0]?.prob}`, flutterClient);
    console.log('Confidence2', secondBBs[0]?.prob);

    distance = calcDistance(firstBBs, secondBBs);
    console.log(firstBBs.length);
    //Clearing the Buffers
    firstBBs.splice(0, firstBBs.length);
    secondBBs.splice(0, secondBBs.length);
    console.log(firstBBs.length);
    return distance;
}

const motions = {
    'fwd': ForwardWalkingFrameData,
    'bwd': BackwardWalkingFrameData,
    'leftSide': LeftSideWalkSimulationData,
    'rightSide': RightSideWalkSimulationData,
    'clockRotate': ClockwiseRotationSimulationData,
    'antiClockRotate': CounterClockwiseRotationSimulationData,
    'pickup': pickupSimulationData,
};


async function runMotion(motionName, flutterClient, espClient) {
    const motion = motions[motionName];
    const motionLength = Object.keys(motion).length;
    sendControlMessageToFlutter(`Running ${motionName} motion`, flutterClient);
    //Run for Motion Length
    for (let i = 0; i < motionLength; i++) {
        const response = {
            'type': 'motion-planning',
            'key': 21,
            'value': motion[i],
        };
        sendControlMessageToFlutter(`Running ${motionName} motion's frame ${i}`, flutterClient);
        espClient.forEach((element) => {
            element.send(JSON.stringify(response));
        });
        await delay();
    }
}

module.exports = handleFinalAction;


