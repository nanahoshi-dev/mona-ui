export interface MonaColorGradientMessages {
    readonly alpha: string;
    readonly alphaText: (opacity: number) => string;
    readonly apply: string;
    readonly blue: string;
    readonly cancel: string;
    readonly clearColor: string;
    readonly colorCopied: string;
    readonly colorGradient: string;
    readonly copyAsHex: string;
    readonly copyAsRgb: string;
    readonly copyColor: string;
    readonly copyFailed: string;
    readonly currentColor: string;
    readonly green: string;
    readonly hexColor: string;
    readonly hue: string;
    readonly previousColor: string;
    readonly red: string;
    readonly saturation: string;
    readonly saturationAndValue: string;
    readonly saturationAndValueText: (saturation: number, value: number) => string;
    readonly switchColorMode: string;
    readonly value: string;
}

