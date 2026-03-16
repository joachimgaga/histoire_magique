const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appJsonPath = path.join(__dirname, "../app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

const [major, minor, patch] = appJson.expo.version.split(".").map(Number);
appJson.expo.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");
console.log(`Version bumped to ${appJson.expo.version}`);

// Commit and push
execSync("git add app.json", { stdio: "inherit" });
execSync(`git commit -m "chore: bump version to ${appJson.expo.version}"`, { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
