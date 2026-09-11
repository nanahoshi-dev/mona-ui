export interface MonaColorGradientMessages {
    readonly apply: string;
    readonly cancel: string;
    readonly clearColor: string;
    readonly copyAsHex: string;
    readonly copyAsRgb: string;
    readonly copyColor: string;
    readonly currentColor: string;
    readonly previousColor: string;
    readonly saturationAndValue: string;
    readonly saturationAndValueText: (saturation: number, value: number) => string;
    readonly switchColorMode: string;
}

