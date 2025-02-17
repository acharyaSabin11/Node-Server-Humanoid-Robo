const express = require('express')  // Server made through Express App.
const controlRouter = require('./routes/flutterControl')    // Router that handles the control functions.
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { ForwardWalkingFrameData } = require('./motionData/ForwardWalking');
const { LeftSideWalkSimulationData } = require('./motionData/LeftSideWalking');
const { CounterClockwiseRotationSimulationData } = require('./motionData/CounterClockwiseRotation');
const { pickupSimulationData } = require('./motionData/PickupSimulationData');

//Instantiating express App
const app = express()
const port = 3000;  //port 3000

//Creating the HTTP server
const server = http.createServer(app);

//Attaching the websocket server
const wss = new WebSocket.Server({ server });


app.use(express.json());

//diverting control requests to fluttercontrol router
app.use('/control', controlRouter);


// On Requesting on the Server's Root.
app.use('/', (req, res) => {
    res.send('<h1>Welcome to Humanoid Robot Project at Thapathali Campus</h1>');
});


//Server's ip and port.
server.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
});


//This part has same websocket handling as the Virtual hand project in minor project.
//API keys to identify the clients.
const apiKeys = {
    'ESPClient': 'a1b2-c3d4-e5f6-g7h8-i9',
    'FlutterClient': 'A1B2-C3D4-E5F6-G7H8-I9'
};

//Client Names to easily identify the clients.
const clientNames = {
    'esp': 'ESP32',
    'unity': 'Flutter Application'
};







// const walkingFrameData = {
//     '0': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
//         0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
//         0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
//         0.0, 0.0,
//         0.88
//     ],
//     '1': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, 10.0, 0.0, 0.0, 0.0, -12.0,
//         0.0, 10.0, 0.0, 0.0, 0.0, -12.0,
//         0.0, 0.0,
//         0.4
//     ],

//     '2': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, 10.0, 35.8, -60.5, 29.4, -12.0,
//         0.0, 10.0, 0.0, 0.0, 0.0, -12.0,
//         0.0, 0.0,
//         1.0
//     ],
//     '3': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, -10.0, 26.8, -60.5, 20.4, -12.0,
//         0.0, -10.0, 0.0, 0.0, 0.0, -14.0,
//         0.0, 0.0,
//         0.64
//     ],
//     '4': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, -11.0, 25.5, -29.8, 9.6, 12.0,
//         0.0, -10.0, 1.5, -16.5, 22.7, 12.0,
//         0.0, 0.0,
//         1.5
//     ],
//     '5': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, -8.0, 0.0, 0.0, 0.0, 12.0,
//         0.0, -10.0, 4.8, -60.5, 29.4, 12.0,
//         0.0, 0.0,
//         1.0
//     ],
//     '6': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, -8.0, 0.0, 0.0, 0.0, 8.5,
//         0.0, -8.0, 38.5, -40.2, 2.7, 8.2,
//         0.0, 0.0,
//         1.52
//     ],
//     '7': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
//         0.0, 8.0, 1.5, -16.5, 22.7, -10.0,
//         0.0, 8.0, 25.5, -29.8, 9.6, -10.0,
//         0.0, 0.0,
//         1.52
//     ],
// }

const espClient = [];
const flutterClient = [];

//Handling Websocket requests
wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    ws.apiKey = parameters.query.apiKey;

    //Providing the name for each client
    switch (ws.apiKey) {
        case apiKeys.FlutterClient:
            ws.name = 'Flutter Application';
            flutterClient.push(ws);
            break;
        case apiKeys.ESPClient:
            ws.name = 'ESP32';
            espClient.push(ws);
            // console.log(unityClient.length);
            break;
        default:
            ws.name = 'extruder';
            break;
    }

    console.log(`Connection Request Received from ${ws.name}`);
    console.log(`Req URL = ${req.url}`);
    ws.send(JSON.stringify({ 'message': `Hey ${ws.name}` }));

    // Rejecting the connection request with invalid apikey
    if (!Object.values(apiKeys).includes(ws.apiKey)) {
        ws.send('You have no access to any service from our server. We are disconnecting you.');
        ws.close();
    }

    //Handling message event on each client.
    ws.on('message', (message) => {
        if (ws.apiKey == apiKeys.ESPClient) {
            // console.log('ESP32 is sending message');
            const jsonSeralizedData = message.toString();
            console.log(jsonSeralizedData);
            // // const rawData = JSON.parse(jsonSeralizedData);
            flutterClient.forEach((element) => {
                element.send(jsonSeralizedData);
            })
        } else if (ws.apiKey == apiKeys.FlutterClient) {
            // unityReady = true;
            console.log('Flutter application is sending message');
            // console.log(JSON.parse(message.toString()));
            const object = JSON.parse(message.toString());
            console.log(object);
            // if (motorAngleMap[Object.keys(object)[0]] === Object.values(object)[0]) return;
            let frameNumber = object.frameNumber;
            if (!frameNumber) { frameNumber = 0 };
            if (object.type === 'final_action') {
                handleFinalAction();
                return;
            }

            // console.log(walkingFrameData[frameNumber]);
            const response = {
                'type': object.type,
                'key': object.key,
                'value': object.value,
                'frameNumber': frameNumber,
                'frameIncrease': object.frameIncrease,
            }

            if (object.type === 'server-frame') {
                switch (object.motion) {
                    case 'Forward Walking Motion':
                        response["0"] = ForwardWalkingFrameData[frameNumber][0];
                        response["1"] = ForwardWalkingFrameData[frameNumber][1];
                        response["2"] = ForwardWalkingFrameData[frameNumber][2];
                        response["3"] = ForwardWalkingFrameData[frameNumber][3];
                        response["4"] = ForwardWalkingFrameData[frameNumber][4];
                        response["5"] = ForwardWalkingFrameData[frameNumber][5];
                        response["6"] = ForwardWalkingFrameData[frameNumber][6];
                        response["7"] = ForwardWalkingFrameData[frameNumber][7];
                        response["8"] = ForwardWalkingFrameData[frameNumber][8];
                        response["9"] = ForwardWalkingFrameData[frameNumber][9];
                        response["10"] = ForwardWalkingFrameData[frameNumber][10];
                        response["11"] = ForwardWalkingFrameData[frameNumber][11];
                        response["12"] = ForwardWalkingFrameData[frameNumber][12];
                        response["13"] = ForwardWalkingFrameData[frameNumber][13];
                        response["14"] = ForwardWalkingFrameData[frameNumber][14];
                        response["15"] = ForwardWalkingFrameData[frameNumber][15];
                        response["16"] = ForwardWalkingFrameData[frameNumber][16];
                        response["17"] = ForwardWalkingFrameData[frameNumber][17];
                        response["18"] = ForwardWalkingFrameData[frameNumber][18];
                        response["19"] = ForwardWalkingFrameData[frameNumber][19];
                        break;
                    case 'Left Side Walking Motion':
                        response["0"] = LeftSideWalkSimulationData[frameNumber][0];
                        response["1"] = LeftSideWalkSimulationData[frameNumber][1];
                        response["2"] = LeftSideWalkSimulationData[frameNumber][2];
                        response["3"] = LeftSideWalkSimulationData[frameNumber][3];
                        response["4"] = LeftSideWalkSimulationData[frameNumber][4];
                        response["5"] = LeftSideWalkSimulationData[frameNumber][5];
                        response["6"] = LeftSideWalkSimulationData[frameNumber][6];
                        response["7"] = LeftSideWalkSimulationData[frameNumber][7];
                        response["8"] = LeftSideWalkSimulationData[frameNumber][8];
                        response["9"] = LeftSideWalkSimulationData[frameNumber][9];
                        response["10"] = LeftSideWalkSimulationData[frameNumber][10];
                        response["11"] = LeftSideWalkSimulationData[frameNumber][11];
                        response["12"] = LeftSideWalkSimulationData[frameNumber][12];
                        response["13"] = LeftSideWalkSimulationData[frameNumber][13];
                        response["14"] = LeftSideWalkSimulationData[frameNumber][14];
                        response["15"] = LeftSideWalkSimulationData[frameNumber][15];
                        response["16"] = LeftSideWalkSimulationData[frameNumber][16];
                        response["17"] = LeftSideWalkSimulationData[frameNumber][17];
                        response["18"] = LeftSideWalkSimulationData[frameNumber][18];
                        response["19"] = LeftSideWalkSimulationData[frameNumber][19];
                        break;
                    case 'Counter Clockwise Rotation Motion':
                        response["0"] = CounterClockwiseRotationSimulationData[frameNumber][0];
                        response["1"] = CounterClockwiseRotationSimulationData[frameNumber][1];
                        response["2"] = CounterClockwiseRotationSimulationData[frameNumber][2];
                        response["3"] = CounterClockwiseRotationSimulationData[frameNumber][3];
                        response["4"] = CounterClockwiseRotationSimulationData[frameNumber][4];
                        response["5"] = CounterClockwiseRotationSimulationData[frameNumber][5];
                        response["6"] = CounterClockwiseRotationSimulationData[frameNumber][6];
                        response["7"] = CounterClockwiseRotationSimulationData[frameNumber][7];
                        response["8"] = CounterClockwiseRotationSimulationData[frameNumber][8];
                        response["9"] = CounterClockwiseRotationSimulationData[frameNumber][9];
                        response["10"] = CounterClockwiseRotationSimulationData[frameNumber][10];
                        response["11"] = CounterClockwiseRotationSimulationData[frameNumber][11];
                        response["12"] = CounterClockwiseRotationSimulationData[frameNumber][12];
                        response["13"] = CounterClockwiseRotationSimulationData[frameNumber][13];
                        response["14"] = CounterClockwiseRotationSimulationData[frameNumber][14];
                        response["15"] = CounterClockwiseRotationSimulationData[frameNumber][15];
                        response["16"] = CounterClockwiseRotationSimulationData[frameNumber][16];
                        response["17"] = CounterClockwiseRotationSimulationData[frameNumber][17];
                        response["18"] = CounterClockwiseRotationSimulationData[frameNumber][18];
                        response["19"] = CounterClockwiseRotationSimulationData[frameNumber][19];
                        break;
                    case 'Pickup Motion':
                        console.log(pickupSimulationData);
                        response["0"] = pickupSimulationData[frameNumber][0];
                        response["1"] = pickupSimulationData[frameNumber][1];
                        response["2"] = pickupSimulationData[frameNumber][2];
                        response["3"] = pickupSimulationData[frameNumber][3];
                        response["4"] = pickupSimulationData[frameNumber][4];
                        response["5"] = pickupSimulationData[frameNumber][5];
                        response["6"] = pickupSimulationData[frameNumber][6];
                        response["7"] = pickupSimulationData[frameNumber][7];
                        response["8"] = pickupSimulationData[frameNumber][8];
                        response["9"] = pickupSimulationData[frameNumber][9];
                        response["10"] = pickupSimulationData[frameNumber][10];
                        response["11"] = pickupSimulationData[frameNumber][11];
                        response["12"] = pickupSimulationData[frameNumber][12];
                        response["13"] = pickupSimulationData[frameNumber][13];
                        response["14"] = pickupSimulationData[frameNumber][14];
                        response["15"] = pickupSimulationData[frameNumber][15];
                        response["16"] = pickupSimulationData[frameNumber][16];
                        response["17"] = pickupSimulationData[frameNumber][17];
                        response["18"] = pickupSimulationData[frameNumber][18];
                        response["19"] = pickupSimulationData[frameNumber][19];
                        break;
                    default:
                        response["0"] = pickupSimulationData[frameNumber][0];
                        response["1"] = pickupSimulationData[frameNumber][1];
                        response["2"] = pickupSimulationData[frameNumber][2];
                        response["3"] = pickupSimulationData[frameNumber][3];
                        response["4"] = pickupSimulationData[frameNumber][4];
                        response["5"] = pickupSimulationData[frameNumber][5];
                        response["6"] = pickupSimulationData[frameNumber][6];
                        response["7"] = pickupSimulationData[frameNumber][7];
                        response["8"] = pickupSimulationData[frameNumber][8];
                        response["9"] = pickupSimulationData[frameNumber][9];
                        response["10"] = pickupSimulationData[frameNumber][10];
                        response["11"] = pickupSimulationData[frameNumber][11];
                        response["12"] = pickupSimulationData[frameNumber][12];
                        response["13"] = pickupSimulationData[frameNumber][13];
                        response["14"] = pickupSimulationData[frameNumber][14];
                        response["15"] = pickupSimulationData[frameNumber][15];
                        response["16"] = pickupSimulationData[frameNumber][16];
                        response["17"] = pickupSimulationData[frameNumber][17];
                        response["18"] = pickupSimulationData[frameNumber][18];
                        response["19"] = pickupSimulationData[frameNumber][19];
                        break;
                }
            }

            console.log(response);
            espClient.forEach((element) => {
                element.send(JSON.stringify(response));
            });
            // motorAngleMap[Object.keys(object)[0]] === Object.values(object)[0];
        }
        else {
            ws.send(`You have no messaging permission.`);
        }
    });

    //Handling websocket connection closing event.
    ws.on('close', (code, reason) => {
        console.log(`Connection closed with ${ws.name} with code ${code} and reason ${reason}`);
    });
});


const motorAngleMap = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
    "11": 0,
    "12": 0,
    "13": 0,
    "14": 0,
    "15": 0,
    "16": 0,
};

function handleFinalAction() {
    // See if there is any object in the frame. i.e. perform distance estimation
    // If there is any object, store the distance
    sendControlMessageToFlutter('Started the Final Action Process');
    sendControlMessageToFlutter('Detecting Object');
    // If there is no object, rotate the head by 10 degrees and perform distance estimation
    // If there is any object, store the distance
}

function sendControlMessageToFlutter(message) {
    const response = {
        'type': 'control_info',
        'message': message,
    };
    flutterClient.forEach((element) => {
        element.send(JSON.stringify(response));
    });
}