const { json } = require("body-parser");

let config = {
    showBoundingBoxes: false,
    frameRate: 10,
    passthroughSelector: 'output',
    saveBoundingBoxes: false,
    firstDistance: 0,
    secondDistance: 0,
    isFirstDistance: null,
    stream1BoundingBoxesCalculated: false,
    stream2BoundingBoxesCalculated: false,
    bothStreamBoundingBoxesCalculated: false,
}

let jsonObj = {}
let firstImages = []
let secondImages = []


//* ************************************************************** Setter Functions to Update Values *******************************************************
function distanceSelector(value) {
    if (value = 1) {
        isFirstDistance = true;
    } else {
        isFirstDistance = false;
    }
}

function updateFirstDistance(distance) {
    config.firstDistance = distance
}

function updateSecondDistance(distance) {
    config.secondDistance = distance
}

function saveBoundingBoxesUpdater(value) {
    config.saveBoundingBoxes = value;
}

function passthroughUpdater(value) {
    config.passthroughSelector = value;
}
//* ************************************************************** Setter Functions to Update Values *******************************************************

module.exports = {
    config,
    passthroughUpdater,
    saveBoundingBoxesUpdater,
    updateFirstDistance,
    updateSecondDistance,
    distanceSelector,
    jsonObj,
    firstImages,
    secondImages,
}