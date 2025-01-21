const express = require('express')  // Server made through Express App.
const controlRouter = require('./routes/flutterControl')    // Router that handles the control functions.
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

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

const walkingFrameData = {
    '0': [
        25.0, 10.0, 0.0,
        65, -35.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0,
        0.88
    ],
    '1': [
        25.0, 10.0, 0.0,
        65, -35.0, 0.0,
        0.0, 10.0, 0.0, 0.0, 0.0, -12.0,
        0.0, 10.0, 0.0, 0.0, 0.0, -12.0,
        0.0, 0.0,
        0.7
    ],
    // '2': [
    //     10.0, 35.0, 0.0,
    //     10.0, -35.0, 0.0,
    //     0.0, -10.0, 50, -60.5, 0.0, -12.0,
    //     0.0, -10.0, 0.0, 0.0, 0.0, -12.0,
    //     0.0, 0.0,
    //     0.64
    // ],
    '2': [
        25.0, 10.0, 0.0,
        65, -35.0, 0.0,
        0.0, -10.0, 0.0, 0.0, -10.0, -20.0,
        0.0, -10.0, 15.0, 0.0, 0.0, -12.0,
        0.0, 0.0,
        1.0
    ],
    '3': [
        25.0, 10.0, 0.0,
        65, -35.0, 0.0,
        0.0, -10.0, 26.8, -60.5, 20.4, -12.0,
        0.0, -10.0, 15.0, 0.0, 0.0, -14.0,
        0.0, 0.0,
        0.64
    ],
    '4': [
        -25, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, -15.0, 45.5, -30.2, 2.7, -10.2,
        0.0, -15.0, 15.0, 0.0, 0.0, -10.5,
        0.0, 0.0,
        1.5
    ],

    '5': [
        -25, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, -5, 45.5, -30.2, 2.7, 0,
        0.0, 12.0, 5, 0.0, 0.0, 0,
        0.0, 0.0,
        1.5
    ],
    '6': [
        -25, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, 0, -5, 0, 2.7, 12.2,
        0.0, 12.0, 1.5, 0, 10.0, 0,
        0.0, 0.0,
        1.5
    ],
    // '7': [
    //     10.0, 35.0, 0.0,
    //     10.0, -35.0, 0.0,
    //     0.0, 0, 25.5, -29.8, 9.6, 12.0,
    //     0.0, 0, 1.5, 0.0, 10.0, 12.0,
    //     0.0, 0.0,
    //     1.0
    // ],
    '7': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, 0, 5.0, 0, 0, 12.0,
        0.0, 0, 1.5, -16.5, 40, 12.0,
        0.0, 0.0,
        1.52
    ],
    // '7': [
    //     10.0, 35.0, 0.0,
    //     10.0, -35.0, 0.0,
    //     0.0, 7, 0.0, 0.0, 0.0, 12.0,
    //     0.0, 15, 4.8, 0, 0, 40.0,
    //     0.0, 0.0,
    //     1.52
    // ],
    //This might be used as 8th frame
    // '8': [
    //     10.0, 35.0, 0.0,
    //     10.0, -35.0, 0.0,
    //     0.0, 15, 0.0, 0.0, 0.0, 12.0,
    //     0.0, 15, 4.8, -60.5, 29.4, 12.0,
    //     0.0, 0.0,
    //     1.52
    // ],
    '8': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, 5, 0.0, 0.0, 0.0, 12,
        0.0, 0, 38.5, -40.2, 2.7, 60,
        0.0, 0.0,
        0.72
    ],
    '9': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, -5, 0.0, 0.0, 0.0, 8.5,
        0.0, 0, 45.7, -30.2, 2.7, 8.2,
        0.0, 0.0,
        0.72
    ],
    '10': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, -8.0, 0.0, 0.0, 0.0, 8.5,
        0.0, -8.0, 38.5, -40.2, 2.7, 8.2,
        0.0, 0.0,
        0.4
    ],
    '11': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, 8.0, 1.5, -16.5, 22.7, -10.0,
        0.0, 0.0, 15.5, -15.8, 9.6, -10.0,
        0.0, 0.0,
        1.2
    ],
    '12': [
        10.0, 35.0, 0.0,
        10.0, -35.0, 0.0,
        0.0, -8, 1.5, -15.2, 35.7, -10.0,
        0.0, -15.0, 10, 5, 0, -18.0,
        0.0, 0.0,
        1.2
    ]
}
// const walkingFrameData = {
//     '0': [
//         10.0, 35.0, 0.0,
//         10.0, -35.0, 0.0,
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
//     // '2': [
//     //     10.0, 35.0, 0.0,
//     //     10.0, -35.0, 0.0,
//     //     0.0, -10.0, 50, -60.5, 0.0, -12.0,
//     //     0.0, -10.0, 0.0, 0.0, 0.0, -12.0,
//     //     0.0, 0.0,
//     //     0.64
//     // ],
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
//     // '8': [
//     //     10.0, 35.0, 0.0,
//     //     10.0, -35.0, 0.0,
//     //     0.0, 15, 0.0, 0.0, 0.0, 12.0,
//     //     0.0, 15, 4.8, -60.5, 29.4, 12.0,
//     //     0.0, 0.0,
//     //     1.52
//     // ],
//     // '9': [
//     //     10.0, 35.0, 0.0,
//     //     10.0, -35.0, 0.0,
//     //     0.0, 15, 0.0, 0.0, 0.0, 12,
//     //     0.0, 5, 38.5, -40.2, 2.7, 60,
//     //     0.0, 0.0,
//     //     0.72
//     // ],
//     // '10': [
//     //     10.0, 35.0, 0.0,
//     //     10.0, -35.0, 0.0,
//     //     0.0, -8.0, 0.0, 0.0, 0.0, 8.5,
//     //     0.0, -8.0, 38.5, -40.2, 2.7, 8.2,
//     //     0.0, 0.0,
//     //     0.72
//     // ],
//     // '11': [
//     //     10.0, 35.0, 0.0,
//     //     10.0, -35.0, 0.0,
//     //     0.0, 8.0, 1.5, -16.5, 22.7, -10.0,
//     //     0.0, 8.0, 25.5, -29.8, 9.6, -10.0,
//     //     0.0, 0.0,
//     //     1.2
//     // ]
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
    ws.send(`Hey ${ws.name}`);

    // Rejecting the connection request with invalid apikey
    if (!Object.values(apiKeys).includes(ws.apiKey)) {
        ws.send('You have no access to any service from our server. We are disconnecting you.');
        ws.close();
    }

    //Handling message event on each client.
    ws.on('message', (message) => {
        if (ws.apiKey == apiKeys.ESPClient) {
            console.log('ESP32 is sending message');
            // const jsonSeralizedData = message.toString();
            // console.log(jsonSeralizedData);
            // // const rawData = JSON.parse(jsonSeralizedData);
            // flutterClient.forEach((element) => {
            //     element.send(jsonSeralizedData);
            // })
        } else if (ws.apiKey == apiKeys.FlutterClient) {
            // unityReady = true;
            console.log('Flutter application is sending message');
            // console.log(JSON.parse(message.toString()));
            const object = JSON.parse(message.toString());
            console.log(object);
            // if (motorAngleMap[Object.keys(object)[0]] === Object.values(object)[0]) return;
            let frameNumber = object.frameNumber;
            if (!frameNumber) { frameNumber = 0 };
            console.log(walkingFrameData[frameNumber]);
            const response = {
                'type': object.type,
                'key': object.key,
                'value': object.value,
                'frameNumber': frameNumber,
                'frameIncrease': object.frameIncrease,
                "0": walkingFrameData[frameNumber][0],
                "1": walkingFrameData[frameNumber][1],
                "2": walkingFrameData[frameNumber][2],
                "3": walkingFrameData[frameNumber][3],
                "4": walkingFrameData[frameNumber][4],
                "5": walkingFrameData[frameNumber][5],
                "6": walkingFrameData[frameNumber][6],
                "7": walkingFrameData[frameNumber][7],
                "8": walkingFrameData[frameNumber][8],
                "9": walkingFrameData[frameNumber][9],
                "10": walkingFrameData[frameNumber][10],
                "11": walkingFrameData[frameNumber][11],
                "12": walkingFrameData[frameNumber][12],
                "13": walkingFrameData[frameNumber][13],
                "14": walkingFrameData[frameNumber][14],
                "15": walkingFrameData[frameNumber][15],
                "16": walkingFrameData[frameNumber][16],
                "17": walkingFrameData[frameNumber][17],
                "18": walkingFrameData[frameNumber][18],
                "19": walkingFrameData[frameNumber][19],
                "20": walkingFrameData[frameNumber][20],
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