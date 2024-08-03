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
    calculateDistance: false,
    stream1DistanceBoundingBoxesCalculated: false,
    stream2DistanceBoundingBoxesCalculated: false,
    bothStreamDistanceBoundingBoxesCalculated: false,
    showBoundingBoxes: false,
}

let jsonObj = {};
let firstImages = [];
let secondImages = [];

let firstBBs = [];
let secondBBs = [];


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

function clearBBs() {
    firstBBs = []
    secondBBs = []
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
    firstBBs,
    secondBBs,
    clearBBs,
}