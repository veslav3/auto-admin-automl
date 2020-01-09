async function convertToArrayWithCoords(data) {
    const array = data.results;
    const map = new Map();
    array.forEach(element => {
        map.set(element.label, element.box)
    });

    return map;
}

module.exports = convertToArrayWithCoords