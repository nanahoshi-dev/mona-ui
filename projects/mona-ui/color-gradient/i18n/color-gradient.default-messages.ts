import { MonaColorGradientMessages } from "@nanahoshi/mona-ui/i18n";

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
        `Saturation ${saturation}%, Value ${value}%`,
    switchColorMode: "Switch color mode"
};

