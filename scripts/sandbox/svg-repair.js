// DISCLOSURE: ai
// node scripts/sandbox/svg-repair.js scripts/sandbox/svg-repair-before.svg scripts/sandbox/svg-repair-after.png
const fs = require("fs");
const path = require("path");

const makePng = require("../../src/util/make-png");
const svgRepair = require("../../src/util/svg-repair");

process.argv.shift();
process.argv.shift();
const inputSvgPath = process.argv.shift();
const outputPngPath = process.argv.shift();

const inputSvg = fs.readFileSync(inputSvgPath, "utf8");
const fixedSvg = svgRepair(inputSvg);
makePng(Buffer.from(fixedSvg, "utf8")).then(png => {
    fs.writeFileSync(outputPngPath, png, "utf8");
})