const fs = require("fs");
const path = require("path");
const sharp = require('sharp');

/** @type {import("chroma-js").default} */
const chroma = require("chroma-js");

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class StammerImage {
    /**
     * The Stammer program takes the audio of the 1st input and recreates the 2nd input using it.
     * StammerImage takes the colors of the 1st input and recreates the 2nd input with them.
     * This essentially just remaps the colors of the 2nd image to use the closest 1st image colors
     * @param {Buffer} bufferCarrier should be something sharp accepts
     * @param {Buffer} bufferModulator should be something sharp accepts
     * @param {Function?} processCallback runs after a color has been processed for remapping
     * @returns {Promise<Buffer>} the mixed output
     */
    static async remap(bufferCarrier, bufferModulator, processCallback) {
        const { data:carrierDataContainer, info:carrierInfo } = await sharp(bufferCarrier)
            .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
            .raw()
            .toBuffer({ resolveWithObject: true });
        const { data:modulatorDataContainer, info:modulatorInfo } = await sharp(bufferModulator)
            .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
            .raw()
            .toBuffer({ resolveWithObject: true });
        const carrierData = new Uint8ClampedArray(carrierDataContainer.buffer);
        const modulatorData = new Uint8ClampedArray(modulatorDataContainer.buffer);

        // ok so the faster approach than old implementation is to create a lookup table type of deal so we can palette swap
        // 1. get the decimal colors of the first image into a set,
        // 2. then save the decimal colors of the second image into an Map. this would make the palette of the second image.
        // 3. then make the decimal colors have a value which is the replaced color, so the original decimal color can be used to lookup the replaced color.
        //
        // that way, we can loop through the 2nd image and find the pixel color decimal,
        // then use that to get the replaced color in the Map which will return the swapped color

        // implement that now:
        // 1. get all of the colors in the carrier image
        // we are also gonna drop opacity because its probably nicer to see the 2nd image's opacity rather than the 1st
        const availableColors = new Set();
        for (let i = 0; i < carrierData.length; i += carrierInfo.channels) {
            const colorR = carrierData[i + 0];
            const colorG = carrierData[i + 1];
            const colorB = carrierData[i + 2];
            
            // https://stackoverflow.com/questions/8468855/convert-a-rgb-colour-value-to-decimal
            const colorDecimal = colorR * 65536 + colorG * 256 + colorB;
            availableColors.add(colorDecimal);
        }

        // 2. make the palette
        const modulatorPalette = new Map();
        for (let i = 0; i < modulatorData.length; i += modulatorInfo.channels) {
            const colorR = modulatorData[i + 0];
            const colorG = modulatorData[i + 1];
            const colorB = modulatorData[i + 2];

            const colorDecimal = colorR * 65536 + colorG * 256 + colorB;
            modulatorPalette.set(colorDecimal, 0); // nothing yet
        }

        // 3. palette swap
        let i = 0;
        for (const colorDecimal of modulatorPalette.keys()) {
            const colorR = (colorDecimal & 0xff0000) >> 16;
            const colorG = (colorDecimal & 0x00ff00) >> 8;
            const colorB = (colorDecimal & 0x0000ff);

            // get the closest color, we just assume there is always at *least* 1 color in the list since thats likely guaranteed
            let closestColor = null;
            let closestDistance = Infinity;
            for (const carrierColor of availableColors) {
                const carrierColorR = (carrierColor & 0xff0000) >> 16;
                const carrierColorG = (carrierColor & 0x00ff00) >> 8;
                const carrierColorB = (carrierColor & 0x0000ff);
                const distance = chroma.distance([colorR, colorG, colorB], [carrierColorR, carrierColorG, carrierColorB]);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestColor = carrierColor;
                }
            }

            modulatorPalette.set(colorDecimal, closestColor);
            i++;

            const segmentWaits = Math.round(Math.max(8, 100000 / availableColors.size));
            if (i % segmentWaits == 0) {
                console.log("stammerimage processing color", i, "of", modulatorPalette.size, "(each one does", availableColors.size, ")");
                if (processCallback) processCallback(i, modulatorPalette.size, availableColors.size, segmentWaits);
                await delay(1);
            }
        }
        
        // now grab the colors
        for (let i = 0; i < modulatorData.length; i += modulatorInfo.channels) {
            const colorR = modulatorData[i + 0];
            const colorG = modulatorData[i + 1];
            const colorB = modulatorData[i + 2];
            const colorDecimal = colorR * 65536 + colorG * 256 + colorB;

            const swappedColor = modulatorPalette.get(colorDecimal);
            const swappedColorR = (swappedColor & 0xff0000) >> 16;
            const swappedColorG = (swappedColor & 0x00ff00) >> 8;
            const swappedColorB = (swappedColor & 0x0000ff);

            modulatorData[i + 0] = swappedColorR;
            modulatorData[i + 1] = swappedColorG;
            modulatorData[i + 2] = swappedColorB;
        }
        
        // make the output
        const output = await sharp(modulatorData, { raw: modulatorInfo })
            .png()
            .toBuffer();
        return output;
    }
}

module.exports = StammerImage;