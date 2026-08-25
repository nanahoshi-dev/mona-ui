const fs = require("fs");
const data = JSON.parse(fs.readFileSync("eslint-out.json", "utf8"));
const files = data.filter(f => f.errorCount > 0);
console.log("files with errors:", files.length);
console.log("total errors:", files.reduce((a, f) => a + f.errorCount, 0));
files.forEach(f => console.log(f.filePath));
