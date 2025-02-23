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
const { N } = require('./../variables/constants');
const pickUpDistance = 15;
const rotationAngle = 12;
const forwardStepValue = 5.6;

async function handleFinalAction(flutterClient, espClient) {


    // let centerReducer = 0;
    let headPosition = 90;
    let direction = 1;
    let latestDistance = 0;
    const errorInDistances = [];
    let distance = 0;

    // See if there is any object in the frame. i.e. perform distance estimation
    // If there is any object, store the distance
    sendControlMessageToFlutter('Started the Final Action Process', flutterClient);
    // sendControlMessageToFlutter('Initializing Motors', flutterClient);
    // await initializeMotors(espClient);
    sendControlMessageToFlutter('Starting Camera', flutterClient);
    // Start the camera
    let camsStarted = await startCameras(flutterClient);
    while (!camsStarted) {
        camsStarted = await startCameras(flutterClient);
        if (!camsStarted) {
            sendControlMessageToFlutter('Camera Could Not Be Started', flutterClient);
        }
        else {
            sendControlMessageToFlutter('Camera Started', flutterClient);
        }
    }

    // while (1) {
    //     inCenter = await AreObjectsInCenter(flutterClient);
    //     if (inCenter === true) {
    //         sendControlMessageToFlutter('Objects are in the center', flutterClient);
    //     } else if (inCenter === -1) {
    //         sendControlMessageToFlutter('Object is in right side', flutterClient);
    //         sendControlMessageToFlutter('Moving to the right side', flutterClient);
    //         await delay(2000);
    //         // await runMotion('rightSide', flutterClient, espClient);
    //     } else if (inCenter === 1) {
    //         sendControlMessageToFlutter('Object is in left side', flutterClient);
    //         sendControlMessageToFlutter('Moving to the left side', flutterClient);
    //         await delay(2000);
    //         // await runMotion('leftSide', flutterClient, espClient);
    //     } else if (inCenter === -2) {
    //         sendControlMessageToFlutter('Move to Left Side', flutterClient);
    //         sendControlMessageToFlutter('Moving to the left side', flutterClient);
    //         await delay(2000);
    //         // await runMotion('leftSide', flutterClient, espClient);
    //     } else if (inCenter === 2) {
    //         sendControlMessageToFlutter('Move to right side', flutterClient);
    //         sendControlMessageToFlutter('Moving to the right side', flutterClient);
    //         await delay(2000);
    //         // await runMotion('rightSide', flutterClient, espClient);
    //     } else {
    //         sendControlMessageToFlutter('Where are the objects?', flutterClient);
    //         await delay(2000);
    //         // break;
    //     }
    // }


    // Check if there is any object in the frame
    let [obj1, obj2] = await checkObjectPresence(flutterClient);
    // Only exit this loop if both cameras have detected the object
    // If any one or both of the cameras has not detected the object, keep on rotating the head
    let obj1AfterWalk = false;
    let obj2AfterWalk = false;
    while (!obj1AfterWalk || !obj2AfterWalk) {
        while (!distance) {
            while (!obj1 || !obj2) {
                headPosition = 90;
                while (!obj1 || !obj2) {
                    const [obj1n, obj2n] = await checkObjectPresence(flutterClient);
                    obj1 = obj1n;
                    obj2 = obj2n;
                    if (!obj1 || !obj2) {
                        sendControlMessageToFlutter('No Object Detected at the position', flutterClient);
                        console.log(obj1, obj2)
                        // Rotate the head by 10 degrees
                        headPosition += 10 * direction;
                        if (headPosition < 0) {
                            direction *= -1;
                            break;
                        }
                        if (headPosition > 180) {
                            direction *= -1;
                            headPosition = 90;
                            headPosition += 10 * direction;
                        }
                        controlHead(headPosition, espClient);
                        console.log("Moving head to", headPosition);
                        // Perform distance estimation
                    }
                }

                await delay(1000);

                //Rotating the head by one more step upon detecting the object.
                headPosition += 10 * direction;
                controlHead(headPosition, espClient);
                // This values are set to false for next object checking.
                config.object1Present = false;
                config.object2Present = false;
                // Send the control message to the flutter client
                sendControlMessageToFlutter(`Object Detected at head position ${headPosition}`, flutterClient);
                await delay(5000);

                sendControlMessageToFlutter('Rotating the robot towards the object', flutterClient);
                if (headPosition > 90) {
                    const rotationtimes = Math.floor((headPosition - 90) / rotationAngle);
                    sendControlMessageToFlutter(`Rotating the robot ${rotationtimes} times anti-clockwise`, flutterClient);
                    for (let i = 0; i < rotationtimes; i++) {
                        sendControlMessageToFlutter(`Running Rotation ${i + 1} of ${rotationtimes}`, flutterClient);
                        await runMotion('antiClockRotate', flutterClient, espClient);
                        await delay(1000);
                    }
                }
                else if (headPosition < 90) {
                    const rotationtimes = Math.floor((90 - headPosition) / rotationAngle);
                    sendControlMessageToFlutter(`Rotating the robot ${rotationtimes} times anti-clockwise`, flutterClient);
                    for (let i = 0; i < rotationtimes; i++) {
                        sendControlMessageToFlutter(`Running Rotation ${i + 1} of ${rotationtimes}`, flutterClient);
                        await runMotion('clockRotate', flutterClient, espClient);
                        await delay(1000);
                    }
                }

                controlHead(90, espClient);
                const [obj1n, obj2n] = await checkObjectPresence(flutterClient);
                obj1 = obj1n;
                obj2 = obj2n;
                if (!obj1 || !obj2) {
                    sendControlMessageToFlutter('No Object Detected at the position: Incorrect Rotation. Again checking for the objects.', flutterClient);
                } else {
                    sendControlMessageToFlutter('Object Detected at the position', flutterClient);
                }
            }


            do {
                console.log('Entered loop');
                // Now check if the object is in center or not
                let inCenter;
                while (inCenter !== true) {
                    inCenter = await AreObjectsInCenter(flutterClient);
                    if (inCenter === true) {
                        sendControlMessageToFlutter('Objects are in the center', flutterClient);
                    } else if (inCenter === -1) {
                        sendControlMessageToFlutter('Object is in right side', flutterClient);
                        sendControlMessageToFlutter('Moving to the right side', flutterClient);
                        await runMotion('rightSide', flutterClient, espClient);
                    } else if (inCenter === 1) {
                        sendControlMessageToFlutter('Object is in left side', flutterClient);
                        sendControlMessageToFlutter('Moving to the left side', flutterClient);
                        await runMotion('leftSide', flutterClient, espClient);
                    } else if (inCenter === -2) {
                        sendControlMessageToFlutter('Move to Left Side', flutterClient);
                        sendControlMessageToFlutter('Moving to the left side', flutterClient);
                        await runMotion('leftSide', flutterClient, espClient);
                    } else if (inCenter === 2) {
                        sendControlMessageToFlutter('Move to right side', flutterClient);
                        sendControlMessageToFlutter('Moving to the right side', flutterClient);
                        await runMotion('rightSide', flutterClient, espClient);
                    } else {
                        sendControlMessageToFlutter('Where are the objects?', flutterClient);
                    }
                }
                sendControlMessageToFlutter('Objects are in the center', flutterClient);
                const maxCheckCount = 5;
                for (let i = 0; i < maxCheckCount; i++) {
                    sendControlMessageToFlutter(`Attempting Distance Estimation`, flutterClient);
                    distance = await performDistanceEstimation(flutterClient);
                    if (!distance) {
                        sendControlMessageToFlutter('Distance could not be calculated. Trying once again', flutterClient);
                    } else {
                        break;
                    }
                }

                if (distance) {
                    sendControlMessageToFlutter(`Object is found at distance: ${distance}`, flutterClient);
                } else {
                    sendControlMessageToFlutter('Distance could not be calculated.', flutterClient);
                }

                // Here we have a full fledged object detection and distance estimation

                if (distance > 50) {
                    // Now, move the robot towards the object
                    // take 2 steps forward
                    sendControlMessageToFlutter('Moving the robot towards the object', flutterClient);
                    await runMotion('fwd', flutterClient, espClient);
                    await runMotion('fwd', flutterClient, espClient);
                } else if (distance < pickUpDistance) {
                    //Do the pickup movement
                    sendControlMessageToFlutter('Object is within the pickup range', flutterClient);
                    sendControlMessageToFlutter('Running Forward Motion once', flutterClient);
                    await runMotion('fwd', flutterClient, espClient);
                    sendControlMessageToFlutter('Performing Pickup Movement', flutterClient);
                    await runMotion('pickup', flutterClient, espClient);
                    return;
                } else {
                    //The actual control logic lies here
                    //The object is within the range of the robot
                    //Take one step forward
                    if (latestDistance === 0) {
                        latestDistance = distance;
                    } else {
                        const movedDistanceAccToCamera = latestDistance - distance;
                        const errorInDistance = movedDistanceAccToCamera - forwardStepValue;
                        errorInDistances.push(errorInDistance);
                        sendControlMessageToFlutter(`Error in Distance: ${errorInDistance}`, flutterClient);
                        if (errorInDistances.length > 5) {
                            const totalErrors = errorInDistances.reduce((a, b) => a + b, 0);
                            // if (totalErrors > 2) {
                            //     sendControlMessageToFlutter('Error in Distance is greater than 2. Terminating the process', flutterClient);
                            //     return;
                            // }
                        }
                    }
                    await runMotion('fwd', flutterClient, espClient);
                }
                // Check if the object is still present
                const [obj1f, obj2f] = await checkObjectPresence(flutterClient);
                obj1AfterWalk = obj1f;
                obj2AfterWalk = obj2f;
                if (!obj1f || !obj2f) {
                    sendControlMessageToFlutter('Object is not present at the position. Again checking for the objects.', flutterClient);
                    distance = 0;
                } else {
                    distance = 0;
                }
            } while (obj1AfterWalk && obj2AfterWalk);
        }
    }


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
    // await delay(1000);
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
    await delay(4000);
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
    if (!firstBBs[0]?.prob || !secondBBs[0]?.prob) {
        return 0;
    }

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
    let motion = motions[motionName];
    const motionLength = Object.keys(motion).length;
    sendControlMessageToFlutter(`Running ${motionName} motion`, flutterClient);
    //Run for Motion Length
    for (let i = 0; i < motionLength; i++) {
        const frameData = motion[i];
        sendControlMessageToFlutter(`Running Frame ${i + 1} of ${motionName} motion`, flutterClient);
        const response = {
            'type': 'server-frame',
            'frameNumber': i,
            'frameIncrease': true,
            'key': 122,
            'value': 123,
            '0': frameData[0],
            '1': frameData[1],
            '2': frameData[2],
            '3': frameData[3],
            '4': frameData[4],
            '5': frameData[5],
            '6': frameData[6],
            '7': frameData[7],
            '8': frameData[8],
            '9': frameData[9],
            '10': frameData[10],
            '11': frameData[11],
            '12': frameData[12],
            '13': frameData[13],
            '14': frameData[14],
            '15': frameData[15],
            '16': frameData[16],
            '17': frameData[17],
            '18': frameData[18],
            '19': frameData[19],
        };
        espClient.forEach((element) => {
            element.send(JSON.stringify(response));
        });
        await delay(frameData[19] * 1000 + 300);
        // await delay(1000);
    }
    frameData = motion[0];
    const response = {
        'type': 'server-frame',
        'frameNumber': 0,
        'frameIncrease': true,
        '0': frameData[0],
        '1': frameData[1],
        '2': frameData[2],
        '3': frameData[3],
        '4': frameData[4],
        '5': frameData[5],
        '6': frameData[6],
        '7': frameData[7],
        '8': frameData[8],
        '9': frameData[9],
        '10': frameData[10],
        '11': frameData[11],
        '12': frameData[12],
        '13': frameData[13],
        '14': frameData[14],
        '15': frameData[15],
        '16': frameData[16],
        '17': frameData[17],
        '18': frameData[18],
        '19': frameData[19],
    };
    espClient.forEach((element) => {
        element.send(JSON.stringify(response));
    });
    await delay(1000);

}

const MotorMap = {
    '15': 94,
    '2': 90,
    '4': 90,
    '5': 119,
    '18': 105,
    '19': 85,
    '33': 92,
    '25': 92,
    '26': 99,
    '27': 70,
    '14': 81,
    '12': 86,
    '40': 37,
    '50': 135,
    '60': 65,
    '70': 105,
    '80': 90,
    '90': 83,
    '23': 90,
}

async function initializeMotors(espClient) {
    const motors = 19;
    for (let i = 0; i < motors; i++) {
        const response = {
            'type': 'motion-planning',
            'key': i,
            'value': MotorMap[i],
        };
        espClient.forEach((element) => {
            element.send(JSON.stringify(response));
        });
        await delay(1000);
    }
}

async function AreObjectsInCenter(flutterClient) {
    await delay(2000);
    config.calculateDistance = true;
    while (!config.bothStreamDistanceBoundingBoxesCalculated) {
        sendControlMessageToFlutter('Waiting for bounding boxes to be calculated from both streams', flutterClient);
        await delay(500);
    }

    sendControlMessageToFlutter(`Confidence of first Stream: ${firstBBs[0]?.prob}`, flutterClient);
    console.log('Confidence1', firstBBs[0]?.prob);
    sendControlMessageToFlutter(`Confidence of second Stream: ${secondBBs[0]?.prob}`, flutterClient);
    console.log('Confidence2', secondBBs[0]?.prob);

    if (firstBBs[0]?.prob && secondBBs[0]?.prob) {

        const firstX1 = firstBBs[0].x1;
        const firstX2 = firstBBs[0].x2;
        const secondX1 = secondBBs[0].x1;
        const secondX2 = secondBBs[0].x2;

        const firstCenter = (firstX1 + firstX2) / 2;
        const secondCenter = (secondX1 + secondX2) / 2;
        const frameCenter = N / 2;

        let returnValue;
        console.log(firstCenter, secondCenter, frameCenter);

        if (Math.abs(firstCenter - frameCenter) < 150 && Math.abs(secondCenter - frameCenter) < 150) {
            sendControlMessageToFlutter(`First Center is ${firstCenter}`, flutterClient);
            sendControlMessageToFlutter(`Second Center is ${secondCenter}`, flutterClient);
            returnValue = true;
        }
        else if (firstCenter - frameCenter < -150) {
            sendControlMessageToFlutter(`First Center is ${firstCenter}`, flutterClient);
            returnValue = -1;
        } else if (secondCenter - frameCenter > 150) {
            // secondCenter - frameCenter < -100;
            sendControlMessageToFlutter(`Second Center is ${secondCenter}`, flutterClient);
            returnValue = 1;
        }
        //Clearing the Buffers
        firstBBs.splice(0, firstBBs.length);
        secondBBs.splice(0, secondBBs.length);
        return returnValue;
    } else if (!firstBBs[0]?.prob && secondBBs[0]?.prob) {
        firstBBs.splice(0, firstBBs.length);
        secondBBs.splice(0, secondBBs.length);
        return 2;
    } else if (firstBBs[0]?.prob && !secondBBs[0]?.prob) {
        firstBBs.splice(0, firstBBs.length);
        secondBBs.splice(0, secondBBs.length);
        return -2;
    } else {
        firstBBs.splice(0, firstBBs.length);
        secondBBs.splice(0, secondBBs.length);
        return 0;
    }
}

module.exports = handleFinalAction;


