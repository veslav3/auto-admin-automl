export async function convertToArrayWithBBs(data) {
    const array = data.payload;
    const map = new Map();
    array.forEach(element => {
        map.set(element.displayName, element.imageObjectDetection.boundingBox.normalizedVertices)
    });

    return map;
}