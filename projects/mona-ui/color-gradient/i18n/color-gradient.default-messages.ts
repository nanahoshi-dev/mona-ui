// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaColorGradientMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const COLOR_GRADIENT_DEFAULT_MESSAGES: MonaColorGradientMessages = {
    apply: "Apply",
    cancel: "Cancel",
    clearColor: "Clear color",
    copyAsHex: "Copy as HEX",
    copyAsRgb: "Copy as RGB",
    copyColor: "Copy color",
    currentColor: "Current color",
    previousColor: "Previous color",
    saturationAndValue: "Color saturation and value",
    saturationAndValueText: (saturation: number, value: number) =>
        `Saturation ${localizeNumber(saturation)}%, Value ${localizeNumber(value)}%`,
    switchColorMode: "Switch color mode"
};
