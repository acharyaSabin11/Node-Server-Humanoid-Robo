const { N, dc } = require('./../variables/constants');
const fs = require('fs');

let tantheta, f;
//Initializes the parameters by reading them from the file.
function getParameters() {
    const string = fs.readFileSync('./frames/callibrated.json');
    const parsed = JSON.parse(string);
    tantheta = parsed.tantheta;
    f = parsed['focal-length'];
}
getParameters();

function calcDistance(boundingBoxes1, boundingBoxes2) {
    try {
        let pix1 = avgCenterCalculator(boundingBoxes1);
        let pix2 = avgCenterCalculator(boundingBoxes2);
        console.log("pix1:", pix1)
        console.log("pix2:", pix2)
        let p = Math.abs(pix1 - pix2);
        console.log("p", p);
        console.log("f", f);
        console.log("tantheta", tantheta);
        console.log("dc", dc);
        console.log("N", N);
        distance = f + (N * dc) / (2 * p * tantheta)
        if (distance === Infinity) {
            return 0;
        }
        return distance;
    } catch (error) {
        console.log(error);
        return 0;
    }
}

function avgCenterCalculator(list) {
    let counter = 0;
    let sum = 0;
    let shift = 0;
    for (let i of list) {
        if (i.label != 'No Object') {
            sum += (i.x2 + i.x1) / 2;
            counter++;
        } else {
            console.log('Not Working')
        }
    }
    if (counter != 0) {
        shift = sum / counter;
        return shift
    }
    return 0;
}


module.exports = {
    calcDistance,
    avgCenterCalculator,
}