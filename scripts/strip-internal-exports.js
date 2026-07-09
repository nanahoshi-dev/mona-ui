const fs = require("fs");
const path = require("path");

const INTERNAL_ONLY_SUBPATHS = [
    "./date-input",
    "./internal",
    "./internal/filter-input",
    "./internal/indicator-icon",
    "./internal/list",
    "./internal/tree",
    "./query"
];

const pkgPath = path.join(__dirname, "..", "dist", "mona-ui", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

for (const subpath of INTERNAL_ONLY_SUBPATHS) {
    delete pkg.exports[subpath];
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
