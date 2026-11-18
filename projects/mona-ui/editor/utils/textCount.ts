import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/** What {@link countEditorText} counts: characters as people see them, or words. */
export type EditorTextUnit = "characters" | "words";

/** Elements that start a new block of text, so the words on either side of them stay apart. */
const BLOCK_ELEMENTS = new Set([
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "BR",
    "DD",
    "DIV",
    "DL",
    "DT",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HR",
    "LI",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TD",
    "TH",
    "TR",
    "UL"
]);

const segmenters = new Map<string, Intl.Segmenter | null>();

function createSegmenter(locale: string | undefined, granularity: "grapheme" | "word"): Intl.Segmenter | null {
    try {
        return typeof Intl.Segmenter === "function" ? new Intl.Segmenter(locale, { granularity }) : null;
    } catch {
        return null;
    }
}

function segmenter(locale: string | undefined, granularity: "grapheme" | "word"): Intl.Segmenter | null {
    const key = `${locale ?? ""}|${granularity}`;
    if (!segmenters.has(key)) {
        segmenters.set(key, createSegmenter(locale, granularity));
    }
    return segmenters.get(key) ?? null;
}

/**
 * Counts the characters or words of plain text. A character is what people see as one, so an emoji or a letter with
 * an accent counts once. Words are found the locale's way, so text without spaces, such as Japanese, counts its words.
 */
export function countText(text: string, unit: EditorTextUnit, locale?: string): number {
    if (unit === "characters") {
        const graphemes = segmenter(locale, "grapheme");
        if (!graphemes) {
            return Array.from(text).length;
        }
        let count = 0;
        for (const _ of graphemes.segment(text)) {
            count++;
        }
        return count;
    }
    const words = segmenter(locale, "word");
    if (!words) {
        return text.split(/\s+/u).filter(word => word.length > 0).length;
    }
    let count = 0;
    for (const segment of words.segment(text)) {
        if (segment.isWordLike) {
            count++;
        }
    }
    return count;
}

/**
 * The text of the content, for counting: blocks and line breaks are apart for words, and add nothing for characters.
 * A mention is its `@label`; images and other leaves are nothing.
 */
export function documentText(doc: ProseMirrorNode, unit: EditorTextUnit): string {
    const separator = unit === "words" ? "\n" : "";
    return doc.textBetween(0, doc.content.size, separator, leaf => {
        if (leaf.type.name === "mention") {
            return `@${String(leaf.attrs["label"] ?? leaf.attrs["id"] ?? "")}`;
        }
        return leaf.type.name === "hardBreak" ? separator : "";
    });
}

function htmlText(html: string, separator: string): string {
    if (typeof DOMParser === "undefined") {
        return html.replace(/<[^>]*>/gu, separator);
    }
    const body = new DOMParser().parseFromString(html, "text/html").body;
    let text = "";
    const walk = (node: Node): void => {
        if (node.nodeType === 3) {
            text += node.nodeValue ?? "";
            return;
        }
        if (node.nodeType !== 1) {
            return;
        }
        const block = BLOCK_ELEMENTS.has((node as Element).tagName);
        if (block) {
            text += separator;
        }
        node.childNodes.forEach(walk);
    };
    body.childNodes.forEach(walk);
    return text;
}

/**
 * Counts the characters or words of the editor's HTML value, as the editor's own count does: the text people see,
 * without the markup. Use it in a validator for a limit:
 *
 * ```ts
 * validate(path.body, ({ value }) =>
 *     countEditorText(value(), "characters") > 500 ? { kind: "tooLong", message: "Keep it to 500 characters." } : undefined
 * );
 * ```
 *
 * @param html The editor's value.
 * @param unit Characters, as people see them, or words.
 * @param locale The locale whose rules find the words, such as `"ja-JP"`. Defaults to the browser's.
 */
export function countEditorText(html: string, unit: EditorTextUnit, locale?: string): number {
    return countText(htmlText(html, unit === "words" ? "\n" : ""), unit, locale);
}
