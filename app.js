const express = require('express')
const controlRouter = require('./routes/flutterControl')

//Instantiating express App
const app = express()
const port = 3000;

app.use(express.json());

//diverting control requests to fluttercontrol router
app.use('/control', controlRouter);

app.use('/', (req, res) => {
    res.send('<h1>Welcome to Humanoid Robot Project at Thapathali Campus</h1>');
});


app.listen(port, () => {
    console.log(`Server started on port: ${port}`)
});
