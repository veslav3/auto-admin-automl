const fs = require('fs'), gm = require('gm');
const fileName = './resources/02-01-2020.jpg';

async function quickstart() {
    // Imports the Google Cloud client library
    const vision = require('@google-cloud/vision');
  
    // Creates a client
    const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};

    const client = new vision.ImageAnnotatorClient(clientOptions);


    let sampledata = fs.readFileSync('./example-data/label-detection.json', 'UTF-8');
    sampledata = sampledata.trim();
    const map = await convertToArrayWithBBs(JSON.parse(sampledata));

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
        console.log(x, detections[1].description)
    }
}

function crop(name, values, size) {
    const first = values[0];
    const second = values[1];
    gm(fileName).crop((size.width * second.x) - size.width * first.x, (size.height * second.y) - size.height * first.y, size.width * first.x, size.height * first.y).write(`./resources/${name}.jpg`, (err) => err ? console.error(err) : null);
}

async function convertToArrayWithBBs(data) {
    const array = data.payload;
    const map = new Map();
    array.forEach(element => {
        map.set(element.displayName, element.imageObjectDetection.boundingBox.normalizedVertices)
    });

    return map;
}

if (require.main === module) {
    try {
        quickstart()
    } catch(err) {
        console.error(err)
    }
}