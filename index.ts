import sharp from "sharp";
import path from "path";
import fs from "fs";

const inputDir = "./input"; // Cartella dove salvare l'immagine finale
const outputImage = "output.jpg"

const shiftColumn = 0
const totalColumn = 6

const shiftRow = 0
const totalRow = 9

let currentOffsetLeft = 0;
let currentOffsetTop = 0;


(async () => {
    const timeNow = Date.now();
    console.log("Start merging images...");
    const totalDimension = await countTotalDimensionPixel(inputDir, totalColumn, totalRow);
    const images = await loadImages(totalDimension);
    await mergeImages(images, totalDimension);
    console.log("Total time in seconds", (Date.now() - timeNow) / 1000);

})();

async function countTotalDimensionPixel(imagesDir: string, numberOfColumn: number, numberOfRow: number) {
    let count = {
        height: 0,
        width: 0
    }
    for (let row = shiftRow; row < numberOfRow; row++) {
        const filePath = path.join(imagesDir, `${row}_0.jpg`);
        const imageBuffer = fs.readFileSync(filePath);
        const height = await sharp(imageBuffer).metadata();
        count.height += height.height!;
    }
    for (let col = shiftColumn; col < numberOfColumn; col++) {
        const filePath = path.join(imagesDir, `0_${col}.jpg`);
        const imageBuffer = fs.readFileSync(filePath);
        const width = await sharp(imageBuffer).metadata();
        count.width += width.width!;
    }
    return count;
}


function loadImage(top: number, left: number, path: string) {
    return {
        input: path,
        top: top,
        left: left,
    };
}

async function loadImages(totalDimension: { height: number, width: number }): Promise<sharp.OverlayOptions[]> {
    const images: sharp.OverlayOptions[] = [];
    currentOffsetLeft = 0;
    currentOffsetTop = 0;
    for (let row = shiftRow; row < totalRow; row++) {
        for (let col = shiftColumn; col < totalColumn; col++) {
            const currentImagePath = path.join(inputDir, `${row}_${col}.jpg`);
            const loadedImage = loadImage(
                currentOffsetLeft!,
                currentOffsetTop!,
                currentImagePath);
            images.push(loadedImage);
            const metadata = await loadImageOriginalMetadata(currentImagePath);
            currentOffsetTop += metadata.height!;
        }
        currentOffsetTop = 0;
        const metadataW = await loadImageOriginalMetadata(path.join(inputDir, `${row}_0.jpg`));
        currentOffsetLeft += metadataW.width!;

    }
    return images;
}
async function loadImageOriginalMetadata(path: string) {
    const imageBuffer = fs.readFileSync(path);
    return await sharp(imageBuffer).metadata();
}


async function mergeImages(images: sharp.OverlayOptions[], dimensions: { height: number, width: number }) {
    console.log("Merging images", images.length);
    const finalImage = sharp({
        create: {
            width: dimensions.width,
            height: dimensions.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    });


    await finalImage.composite(images).toFile(outputImage);
}

