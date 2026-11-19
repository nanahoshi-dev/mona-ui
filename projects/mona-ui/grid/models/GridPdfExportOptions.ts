/** A TrueType font file (`.ttf` or `.ttc`): its bytes, or the URL to fetch it from. */
export type GridPdfFontSource = ArrayBuffer | Uint8Array | string;

/**
 * The font a PDF export embeds for the text Helvetica can't show, such as Chinese, Japanese or Korean. It must have
 * TrueType outlines: most `.otf` files have CFF outlines, and web fonts (`.woff`, `.woff2`) are compressed, so the
 * export rejects both. A variable font prints at its default instance, which is often its lightest weight, so prefer
 * a static font of the weight you want.
 */
export interface GridPdfFont {
    /** The bold face, for the header and the title. Without it, the regular face is drawn thicker. */
    readonly bold?: GridPdfFontSource;
    /** Which font of a TrueType collection (`.ttc`) to use, from 0. */
    readonly collectionIndex?: number;
    readonly regular: GridPdfFontSource;
}

/** A paper size by name, or a page's width and height in points (1/72 inch). */
export type GridPdfPaperSize = "A3" | "A4" | "Legal" | "Letter" | readonly [number, number];

export interface GridPdfExportOptions {
    /** The file's name. Defaults to `export.pdf`. */
    readonly filename?: string;
    /**
     * A TrueType font to embed. Without it, text is set in Helvetica, which shows Western European characters only;
     * other characters print as `?`. Only the glyphs the document uses are embedded.
     */
    readonly font?: GridPdfFont;
    /** The text size in points before a wide table is scaled to fit the page. Defaults to 9. */
    readonly fontSize?: number;
    /** The margin around the page, in points. Defaults to 36 (half an inch). */
    readonly margin?: number;
    /** Defaults to `portrait`. */
    readonly orientation?: "landscape" | "portrait";
    /** Defaults to `A4`. */
    readonly paperSize?: GridPdfPaperSize;
    /** A title printed above the table on the first page, and stored as the document's title. */
    readonly title?: string;
}
