const fs = require("fs");
const path = require("path");





// CONFIG
const ollamaChattingPath = "C:\\Users\\Jeremy\\Documents\\GitHub\\ollama-chatting";




// script
const nodeModulesPath = path.join(__dirname, "node_modules/ollama-chatting");
if (fs.existsSync(ollamaChattingPath) && fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    fs.symlinkSync(ollamaChattingPath, nodeModulesPath);
    console.log("symlinked gng");
} else {
    console.log("paths are wrong gng; make sure this script is running with admin permissions", ollamaChattingPath, nodeModulesPath);
}