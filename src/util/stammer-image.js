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
     * @returns {Promise<Buffer>} the mixed output
     */
    static async remap(bufferCarrier, bufferModulator) {
        const { data:carrierDataContainer, info:carrierInfo } = await sharp(bufferCarrier)
            .resize(64, 64)
            .raw()
            .toBuffer({ resolveWithObject: true });
        const { data:modulatorDataContainer, info:modulatorInfo } = await sharp(bufferModulator)
            .resize(64, 64)
            .raw()
            .toBuffer({ resolveWithObject: true });
        const carrierData = new Uint8ClampedArray(carrierDataContainer.buffer);
        const modulatorData = new Uint8ClampedArray(modulatorDataContainer.buffer);

        // get all of the colors in the carrier image
        const availableColors = new Set();
        for (let i = 0; i < carrierData.length; i += carrierInfo.channels) {
            const colorR = carrierData[i + 0];
            const colorG = carrierData[i + 1];
            const colorB = carrierData[i + 2];
            const colorA = carrierData[i + 3];
            
            const colorString = carrierInfo.channels === 3 ? `rgb(${colorR},${colorG},${colorB})` : `rgba(${colorR},${colorG},${colorB},${colorA / 255})`;
            availableColors.add(colorString);

            if (i % 128 == 0) {
                console.log("get colors", (i / carrierData.length) * 100);
                await delay(1);
            }
        }
        
        // now modify the modulator image so each pixel tries to use the closest color in the list
        for (let i = 0; i < modulatorData.length; i += modulatorInfo.channels) {
            const colorR = modulatorData[i + 0];
            const colorG = modulatorData[i + 1];
            const colorB = modulatorData[i + 2];
            const colorA = modulatorData[i + 3];

            // get the closest color, we just assume there is always at *least* 1 color in the list since thats highly likely
            let closestColor = null;
            let closestDistance = Infinity;
            const chromaColor = modulatorInfo.channels === 3 ? `rgb(${colorR},${colorG},${colorB})` : `rgba(${colorR},${colorG},${colorB},${colorA / 255})`;
            for (const carrierColor of availableColors) {
                const distance = chroma.distance(chromaColor, carrierColor);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestColor = carrierColor;
                }
            }
            
            // set the color to that one
            const newRgba = closestColor
                .slice(closestColor.indexOf("(") + 1, closestColor.indexOf(")"))
                .split(",")
                .map(component => Number(component));
            modulatorData[i + 0] = newRgba[0];
            modulatorData[i + 1] = newRgba[1];
            modulatorData[i + 2] = newRgba[2];
            if (modulatorInfo.channels === 4)
                modulatorData[i + 3] = Math.round(newRgba[3] * 255);

            if (i % 32 == 0) {
                console.log("edit colors", (i / modulatorData.length) * 100);
                await delay(1);
            }
        }
        
        // make the output
        const output = await sharp(modulatorData, { raw: modulatorInfo })
            .png()
            .toBuffer();
        return output;
    }
}

module.exports = StammerImage;