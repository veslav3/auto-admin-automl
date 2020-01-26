require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

gm = require('gm');
const GoogleSpreadsheet = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

const convertToArrayWithCoords = require('./providers/tensorflow-adapter');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '10mb', extended: true}));

app.post('/image', (req, res) => {
    const {image, tensorflow} = req.body;
    google(image, tensorflow);
    res.sendStatus(200);
});

app.listen(3000, () => console.log(`listening on port 3000!`));

async function google(image, tensorflow) {
    const vision = require('@google-cloud/vision');

    const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};

    const client = new vision.ImageAnnotatorClient(clientOptions);

    const map = await convertToArrayWithCoords(tensorflow);

    const row = {};
    for (let label of map.keys()) {
        const coords = map.get(label);
        await crop(label, coords, image);
        const [result] = await client.textDetection(`./resources/${label}.jpg`);
        let detections = result.textAnnotations;

        if (detections[1]) {
            if (label === 'bedrag' || label === 'volume' || label === 'prijsperliter') {
                detections[1].description = detections[1].description.replace(/\./g, ',').replace(/(^,)|(,$)/g, "").replace('/', '');
            }
            row[label] = detections[1].description
        }
    }

    doc.useServiceAccountAuth(creds, function (err) {
        doc.addRow(2, row, function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
}

async function crop(name, values, image) {
    const {left, top, width, height} = values;
    const imageData = Buffer.from(image, "base64");
    console.log(imageData);
    return await new Promise((resolve, reject) => gm(imageData).crop(width, height, left, top).write(`./resources/${name}.jpg`, (err) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    }));
}
