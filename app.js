const express = require('express')  // Server made through Express App.
const controlRouter = require('./routes/flutterControl')    // Router that handles the control functions.

//Instantiating express App
const app = express()
const port = 3000;  //port 3000


app.use(express.json());

//diverting control requests to fluttercontrol router
app.use('/control', controlRouter);


// On Requesting on the Server's Root.
app.use('/', (req, res) => {
    res.send('<h1>Welcome to Humanoid Robot Project at Thapathali Campus</h1>');
});


//Server's ip and port.
app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
});
