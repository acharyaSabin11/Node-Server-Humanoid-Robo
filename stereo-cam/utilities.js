

function calcDistance(boundingBoxes1, boundingBoxes2) {
    const f = 3 //need to update this later
    const tanTheta = 0.4 //need to update this later
    let iteration = boundingBoxes1.length
    let sumDistances = 0;   //sums the distance for each 5 different distances and to take average at last.
    const N = 480   // Width of Full Image in Pixels
    const Ds = 4.75 // Distance between separation of two cameras(in cm)
    let distance = 0;
    for (let i = 0; i < iteration; i++) {
        let box1 = boundingBoxes1[i];
        let box2 = boundingBoxes2[i];

        let pixelShift1 = [box1[0] - box2[0]]
        let pixelShift2 = [box1[2] - box2[2]]

        let p = (pixelShift1 + pixelShift2) / 2

        distance = f + (N * Dc) / (2 * p * tanTheta)
        sumDistances += distance;
    }

    distance = sumDistances / iteration
    return distance
}

module.exports = {
    calcDistance,
}