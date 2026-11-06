/**
 * A swatch with a name of its own, for a palette whose colors mean something, such as brand colors.
 */
export interface ColorPaletteItem {
    /** Any CSS color. */
    readonly color: string;
    /** What the color is called. Assistive technology reads it, and it shows as a tooltip. */
    readonly name?: string;
}
