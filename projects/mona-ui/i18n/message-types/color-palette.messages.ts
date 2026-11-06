export interface MonaColorPaletteMessages {
    readonly color: (color: string) => string;
    readonly colorPalette: string;
    readonly namedColor: (name: string, color: string) => string;
}

