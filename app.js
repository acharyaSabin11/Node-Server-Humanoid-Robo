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
        //Only handling the message request from the ESP 32.
        ws.send(`Hello ${ws.name} you sent -> ${message}`);
        if (ws.apiKey == apiKeys.ESPClient) {
            console.log('ESP32 is sending message');
            // const jsonSeralizedData = message.toString();
            // const rawData = JSON.parse(jsonSeralizedData);
            // const processedData = mapper(rawData);
            // console.log(rawData);
            // unityClient.forEach((element) => {
            //     element.send(JSON.stringify(processedData));
            // })
        } else if (ws.apiKey == apiKeys.FlutterClient) {
            // unityReady = true;
            console.log('Flutter application is sending message');
        }
        else {
            ws.send(`You have no messaging permission.`);
        }
    });

    //Handling websocket connection closing event.
    ws.on('close', (code, reason) => {
        console.log(`Connection closed with ${ws.name} with code ${code} and reason ${reason}`);
    });
})