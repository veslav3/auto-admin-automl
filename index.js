require('dotenv').config();
const express = require('express');

const fs = require('fs'), gm = require('gm');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./credentials/apikey.json');
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

const convertToArrayWithCoords = require('./providers/tensorflow-adapter');
const fileName = './resources/10-01-2020-2.jpg';

const app = express();

app.get('/', (req, res) => {
    res.sendFile('./web/index.html', { root: __dirname });
});

app.get('/:filename', (req, res) => {
    try {
        res.sendFile(`./web/${req.params.filename}`, { root: __dirname });
    } catch (e) {
        res.send(404)
    }
});

app.listen(3000, () => console.log(`listening on port 3000!`));

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

    const row = {};
    for (let label of map.keys()) {
        const coords = map.get(label);
        await crop(label, coords, size);
        const [result] = await client.textDetection(`./resources/${label}.jpg`);
        let detections = result.textAnnotations;

        if (label === 'bedrag' || label === 'volume' || label === 'prijsperliter') {
            detections[1].description = detections[1].description.replace(/\./g, ',').replace(/(^,)|(,$)/g, "");
        }
        row[label] = detections[1].description
    }

    doc.useServiceAccountAuth(creds, function (err) {
        doc.addRow(2, row, function(err) {
            if(err) {
              console.log(err);
            }
          });
      });
}


async function crop(name, values) {
    const {left, top, width, height} = values;
    return await new Promise((resolve, reject) => gm(fileName).crop(width, height, left, top).write(`./resources/${name}.jpg`, (err) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    }));
}

if (require.main === module) {
    try {
        quickstart()
    } catch(err) {
        console.error(err)
    }
}
