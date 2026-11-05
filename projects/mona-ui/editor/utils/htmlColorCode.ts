const CONTEXTS = new WeakMap<Document, CanvasRenderingContext2D | null>();

/**
 * Converts any CSS color to the form a canvas reports (`#rrggbb`, or `rgba(…)` with transparency). One canvas per
 * document is kept for it, since the toolbar asks on every selection change.
 */
export const htmlColorCode = (name: string, document: Document): string => {
    let context = CONTEXTS.get(document);
    if (context === undefined) {
        context = document.createElement("canvas").getContext("2d");
        CONTEXTS.set(document, context);
    }
    if (!context) {
        return "";
    }
    // Reset first, so a color the canvas can't read doesn't report the previous one.
    context.fillStyle = "#000000";
    context.fillStyle = name;
    return context.fillStyle;
};
