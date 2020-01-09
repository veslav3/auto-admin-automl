const fs = require('fs'), gm = require('gm');
const convertToArrayWithCoords = require('./providers/tensorflow-adapter');
const fileName = './resources/07-01-2020.jpg';

async function quickstart() {
    // Imports the Google Cloud client library
    const vision = require('@google-cloud/vision');
  
    // Creates a client
    const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};

    const client = new vision.ImageAnnotatorClient(clientOptions);


    let sampledata = fs.readFileSync('./example-data/tensorflow-label-detection.json', 'UTF-8');
    sampledata = sampledata.trim();
    const map = await convertToArrayWithCoords(JSON.parse(sampledata));

    const size = await new Promise((resolve, reject) => gm(fileName).size((err, data) => {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
    }));
    for (let x of map.keys()) {
        const coords = map.get(x);
        crop(x, coords, size);
        const [result] = await client.textDetection(`./resources/${x}.jpg`);
        const detections = result.textAnnotations;
        if (x === 'prijsperliter') {
            console.log(x, Number.parseFloat(detections[1].description.replace(/,/g, '.')))
        } else {
            console.log(x, detections[1].description)
        }
    }
}

function crop(name, values, size) {
    const {left, top, width, height} = values;
    gm(fileName).crop(width, height, left, top).write(`./resources/${name}.jpg`, (err) => err ? console.error(err) : null);
}

if (require.main === module) {
    try {
        quickstart()
    } catch(err) {
        console.error(err)
    }
}