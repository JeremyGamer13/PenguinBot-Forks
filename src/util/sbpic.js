const { createCanvas } = require('canvas');

const fontSize = 16;
const drawSBPic = (sbpicJson) => {
    // verify things
    if (!Array.isArray(sbpicJson.ops)) throw new Error("ops must be an array of operations to draw");

    // make the image
    const canvas = createCanvas(sbpicJson.w, sbpicJson.h);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Process Operations
    for (const operation of sbpicJson.ops) {
        const color = operation.c || "#000000"; // Default to black
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2; // Standard line thickness

        switch (operation.t) {
            case 'b': // Box
                if (operation.p.length < 4) continue;
                const width = operation.p[2] - operation.p[0];
                const height = operation.p[3] - operation.p[1];
                ctx.fillRect(operation.p[0], operation.p[1], width, height);
                break;
            case 'l': // Line
                if (operation.p.length < 2 || operation.p.length % 2 !== 0) continue;
                ctx.beginPath();
                ctx.moveTo(operation.p[0], operation.p[1]);
                if (operation.p.length > 2) {
                    for (let i = 2; i < operation.p.length; i += 2) {
                        ctx.lineTo(operation.p[i], operation.p[i + 1]);
                    }
                } else {
                    ctx.lineTo(operation.p[0] + 1, operation.p[1]);
                }
                ctx.stroke();
                break;
            case 't': // Text
                if (!operation.s) continue;
                ctx.font = `${fontSize}px Arial`;
                if (operation.p) {
                    ctx.fillText(operation.s, operation.p[0] || 0, operation.p[1] || fontSize);
                } else {
                    ctx.fillText(operation.s, 0, fontSize);
                }
                break;
        }
    }

    const pngBuffer = canvas.toBuffer();
    return pngBuffer;
};

module.exports = drawSBPic;