import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { converter, parse } from "culori";
import { monaThemeColors } from "../../mona-ui/theme/definitions/mona-theme-colors";

const stylesPath = resolve("projects/mona-ui-tester/src/styles.css");
const styles = readFileSync(stylesPath, "utf8");
const themeBlock = /@theme\s*{(?<declarations>[\s\S]*?)\n}/.exec(styles)?.groups?.["declarations"];

if (!themeBlock) {
    throw new Error(`Could not find the @theme block in ${stylesPath}.`);
}

const tailwindColors = Object.fromEntries(
    [...themeBlock.matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)].map(match => [match[1], match[2]])
);
const testerOwnedColors = new Set(["--color-page-background", "--color-demo-background"]);
const runtimeColors = monaThemeColors.light;
const runtimeKeys = Object.keys(runtimeColors).sort();
const tailwindKeys = Object.keys(tailwindColors)
    .filter(key => !testerOwnedColors.has(key))
    .sort();

if (JSON.stringify(tailwindKeys) !== JSON.stringify(runtimeKeys)) {
    const missing = runtimeKeys.filter(key => !tailwindKeys.includes(key));
    const unexpected = tailwindKeys.filter(key => !runtimeKeys.includes(key));
    throw new Error(
        `Tailwind theme color keys do not match Mona runtime colors. Missing: ${missing.join(", ") || "none"}. ` +
            `Unexpected: ${unexpected.join(", ") || "none"}.`
    );
}

for (const [name, value] of Object.entries(runtimeColors)) {
    if (!colorsEqual(tailwindColors[name], value)) {
        throw new Error(
            `Tailwind light fallback for ${name} is "${tailwindColors[name]}"; expected runtime value "${value}".`
        );
    }
}

console.log(`Theme color parity verified for ${runtimeKeys.length} runtime variables.`);

function colorsEqual(left: string | undefined, right: string): boolean {
    if (!left) {
        return false;
    }

    const leftColor = parse(left);
    const rightColor = parse(right);
    if (!leftColor || !rightColor) {
        return left === right;
    }

    const toOklch = converter("oklch");
    const convertedLeft = toOklch(leftColor);
    const convertedRight = toOklch(rightColor);
    if (!convertedLeft || !convertedRight) {
        return false;
    }

    return (
        Math.abs(convertedLeft.l - convertedRight.l) < Number.EPSILON &&
        Math.abs(convertedLeft.c - convertedRight.c) < Number.EPSILON &&
        Math.abs((convertedLeft.h ?? 0) - (convertedRight.h ?? 0)) < Number.EPSILON
    );
}
