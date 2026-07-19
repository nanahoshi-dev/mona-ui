import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { converter, parse } from "culori";
import { annaThemeColors } from "../../mona-ui/theme/definitions/anna-theme-colors";
import { annaThemeShadows } from "../../mona-ui/theme/definitions/anna-theme-shadows";
import { monaThemeColors } from "../../mona-ui/theme/definitions/mona-theme-colors";
import { monaThemeShadows } from "../../mona-ui/theme/definitions/mona-theme-shadows";

const stylesPath = resolve("projects/mona-ui-tester/src/styles.css");
const styles = readFileSync(stylesPath, "utf8");
const themeBlock = /@theme\s*{(?<declarations>[\s\S]*?)\n}/.exec(styles)?.groups?.["declarations"];

if (!themeBlock) {
    throw new Error(`Could not find the @theme block in ${stylesPath}.`);
}

const tailwindColors = Object.fromEntries(
    [...themeBlock.matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)].map(match => [match[1], match[2]])
);
const tailwindShadows = Object.fromEntries(
    [...themeBlock.matchAll(/^\s*(--shadow-[\w-]+):\s*([^;]+);/gm)].map(match => [match[1], match[2]])
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

for (const [name, colors] of Object.entries({
    "Mona Light": monaThemeColors.light,
    "Mona Dark": monaThemeColors.dark,
    "Anna Dark": annaThemeColors.dark
})) {
    const keys = Object.keys(colors).sort();
    if (JSON.stringify(keys) !== JSON.stringify(runtimeKeys)) {
        const missing = runtimeKeys.filter(key => !keys.includes(key));
        const unexpected = keys.filter(key => !runtimeKeys.includes(key));
        throw new Error(
            `${name} does not match the built-in runtime color contract. Missing: ${missing.join(", ") || "none"}. ` +
                `Unexpected: ${unexpected.join(", ") || "none"}.`
        );
    }
}

for (const [name, value] of Object.entries(runtimeColors)) {
    if (!colorsEqual(tailwindColors[name], value)) {
        throw new Error(
            `Tailwind light fallback for ${name} is "${tailwindColors[name]}"; expected runtime value "${value}".`
        );
    }
}

const runtimeShadows = monaThemeShadows.light;
const runtimeShadowKeys = Object.keys(runtimeShadows).sort();
const tailwindShadowKeys = Object.keys(tailwindShadows).sort();

for (const [name, shadows] of Object.entries({
    "Mona Dark": monaThemeShadows.dark,
    "Anna Dark": annaThemeShadows.dark
})) {
    const keys = Object.keys(shadows).sort();
    if (JSON.stringify(keys) !== JSON.stringify(runtimeShadowKeys)) {
        throw new Error(`${name} does not match the built-in runtime shadow contract.`);
    }
}

if (JSON.stringify(tailwindShadowKeys) !== JSON.stringify(runtimeShadowKeys)) {
    throw new Error("Tailwind shadow keys do not match the built-in runtime shadow contract.");
}

for (const [name, value] of Object.entries(runtimeShadows)) {
    if (normalizeCssValue(tailwindShadows[name]) !== normalizeCssValue(value)) {
        throw new Error(
            `Tailwind light fallback for ${name} is "${tailwindShadows[name]}"; expected runtime value "${value}".`
        );
    }
}

console.log(
    `Theme parity verified across ${runtimeKeys.length} color variables and ${runtimeShadowKeys.length} shadow variables.`
);

function normalizeCssValue(value: string | undefined): string {
    return value?.replace(/\s+/g, " ").trim() ?? "";
}

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
