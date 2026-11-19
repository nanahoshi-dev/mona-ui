/**
 * Helvetica and Helvetica Bold, two of the fonts every PDF reader has, so they're used without being embedded. They
 * cover the Windows-1252 characters (WinAnsiEncoding): Latin scripts of Western Europe and common punctuation.
 */

/** Advance widths in thousandths of the font size, from Adobe's font metrics, for codes 32–126. */
const HELVETICA_ASCII = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
    556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
    260, 334, 584
];
const HELVETICA_BOLD_ASCII = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611,
    556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389,
    280, 389, 584
];
/** Codes 128–159 in WinAnsiEncoding; 0 where the code has no character. */
const HELVETICA_HIGH_CONTROL = [
    556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000,
    333, 1000, 500, 333, 944, 0, 500, 667
];
const HELVETICA_BOLD_HIGH_CONTROL = [
    556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000,
    333, 1000, 556, 333, 944, 0, 500, 667
];
/** Codes 160–255, which match Latin-1. */
const HELVETICA_LATIN1 = [
    278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537,
    278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278,
    278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556,
    556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556,
    556, 500, 556, 500
];
const HELVETICA_BOLD_LATIN1 = [
    278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556,
    278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278,
    278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556,
    556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611,
    611, 556, 611, 556
];
/** The characters of WinAnsiEncoding's codes 128–159, which differ from Unicode's. */
const HIGH_CONTROL_CHARACTERS = "€\u0000‚ƒ„…†‡ˆ‰Š‹Œ\u0000Ž\u0000\u0000‘’“”•–—˜™š›œ\u0000žŸ";

const WIN_ANSI_BY_CODE_POINT = new Map<number, number>(
    Array.from(HIGH_CONTROL_CHARACTERS, (char, index) => [char.codePointAt(0)!, 128 + index] as const).filter(
        ([codePoint]) => codePoint !== 0
    )
);

export type StandardFontName = "Helvetica" | "Helvetica-Bold";

/** A character's code in WinAnsiEncoding, or `null` when the encoding has no such character. */
export function toWinAnsiCode(codePoint: number): number | null {
    if ((codePoint >= 32 && codePoint <= 126) || (codePoint >= 160 && codePoint <= 255)) {
        return codePoint;
    }
    return WIN_ANSI_BY_CODE_POINT.get(codePoint) ?? null;
}

/** The advance width of a WinAnsiEncoding code, in thousandths of the font size. */
export function getStandardFontWidth(font: StandardFontName, code: number): number {
    const bold = font === "Helvetica-Bold";
    if (code >= 32 && code <= 126) {
        return (bold ? HELVETICA_BOLD_ASCII : HELVETICA_ASCII)[code - 32];
    }
    if (code >= 128 && code <= 159) {
        return (bold ? HELVETICA_BOLD_HIGH_CONTROL : HELVETICA_HIGH_CONTROL)[code - 128];
    }
    if (code >= 160 && code <= 255) {
        return (bold ? HELVETICA_BOLD_LATIN1 : HELVETICA_LATIN1)[code - 160];
    }
    return 0;
}
