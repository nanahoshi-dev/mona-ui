// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaColorGradientMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const COLOR_GRADIENT_DEFAULT_MESSAGES: MonaColorGradientMessages = {
    alpha: "Alpha",
    alphaText: (opacity: number) => `Opacity ${localizeNumber(opacity)}%`,
    apply: "Apply",
    blue: "Blue",
    cancel: "Cancel",
    clearColor: "Clear color",
    colorCopied: "Color copied",
    colorGradient: "Color gradient",
    copyAsHex: "Copy as HEX",
    copyAsRgb: "Copy as RGB",
    copyColor: "Copy color",
    copyFailed: "Couldn't copy the color",
    currentColor: "Current color",
    green: "Green",
    hexColor: "Hex color",
    hue: "Hue",
    previousColor: "Previous color",
    red: "Red",
    saturation: "Saturation",
    saturationAndValue: "Color saturation and value",
    saturationAndValueText: (saturation: number, value: number) =>
        `Saturation ${localizeNumber(saturation)}%, Value ${localizeNumber(value)}%`,
    switchColorMode: "Switch color mode",
    value: "Value"
};
