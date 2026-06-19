const fs = require("fs");
const path = require("path");





// CONFIG
const syncJsonDatabasePath = "F:\\Github\\simple-json-database";




// script
const nodeModulesPath = path.join(__dirname, "node_modules/sync-json-database");
if (fs.existsSync(syncJsonDatabasePath) && fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    fs.symlinkSync(syncJsonDatabasePath, nodeModulesPath);
    console.log("symlinked gng");
} else {
    console.log("paths are wrong gng; make sure this script is running with admin permissions", syncJsonDatabasePath, nodeModulesPath);
}