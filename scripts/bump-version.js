const fs = require("fs");
const path = require("path");

const appJsonPath = path.join(__dirname, "../app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

const [major, minor, patch] = appJson.expo.version.split(".").map(Number);
appJson.expo.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");
console.log(`Version bumped to ${appJson.expo.version}`);
