import { describe, expect, it } from "vitest";
import { parseClipboardText, parsePastedValue, toClipboardText } from "./grid-clipboard";

describe("toClipboardText", () => {
    it("joins cells with tabs and rows with line breaks", () => {
        expect(
            toClipboardText([
                ["a", "b"],
                ["c", "d"]
            ])
        ).toBe("a\tb\r\nc\td");
    });

    it("quotes a cell with a tab, a line break or a quote, doubling its quotes", () => {
        expect(toClipboardText([["x\ty", 'say "hi"', "two\nlines", "plain"]])).toBe(
            '"x\ty"\t"say ""hi"""\t"two\nlines"\tplain'
        );
    });
});

describe("parseClipboardText", () => {
    it("splits rows on either kind of line break and ignores the last one", () => {
        expect(parseClipboardText("a\tb\r\nc\td\r\n")).toEqual([
            ["a", "b"],
            ["c", "d"]
        ]);
        expect(parseClipboardText("a\nb\n")).toEqual([["a"], ["b"]]);
    });

    it("keeps empty cells, at the ends of a row too", () => {
        expect(parseClipboardText("\ta\t")).toEqual([["", "a", ""]]);
    });

    it("reads quoted cells with tabs, line breaks and doubled quotes", () => {
        expect(parseClipboardText('"x\ty"\t"say ""hi"""\r\n"two\nlines"\tz')).toEqual([
            ["x\ty", 'say "hi"'],
            ["two\nlines", "z"]
        ]);
    });

    it("reads a quote that doesn't wrap the whole cell as a character", () => {
        expect(parseClipboardText('5" pipe\t"half')).toEqual([['5" pipe', '"half']]);
    });

    it("reads what toClipboardText writes back to the same cells", () => {
        const cells = [
            ["a\tb", '"q"', ""],
            ["line\r\nbreak", "plain", "end"]
        ];

        expect(parseClipboardText(toClipboardText(cells))).toEqual(cells);
    });

    it("reads no rows from empty text", () => {
        expect(parseClipboardText("")).toEqual([]);
    });
});

describe("parsePastedValue", () => {
    it("keeps text as it is in a text column", () => {
        expect(parsePastedValue("  spaced  ", "string", "en-US")).toEqual({ value: "  spaced  " });
    });

    it("reads numbers in the locale", () => {
        expect(parsePastedValue("1,234.5", "number", "en-US")).toEqual({ value: 1234.5 });
        expect(parsePastedValue("1.234,5", "number", "de-DE")).toEqual({ value: 1234.5 });
        expect(parsePastedValue("abc", "number", "en-US")).toBeNull();
    });

    it("reads true/false values in their common spellings", () => {
        expect(parsePastedValue("TRUE", "boolean", "en-US")).toEqual({ value: true });
        expect(parsePastedValue("no", "boolean", "en-US")).toEqual({ value: false });
        expect(parsePastedValue("0", "boolean", "en-US")).toEqual({ value: false });
        expect(parsePastedValue("maybe", "boolean", "en-US")).toBeNull();
    });

    it("reads dates written as ISO dates or as the locale writes numeric dates", () => {
        const expected = new Date(2024, 0, 3);
        expect(parsePastedValue("2024-01-03", "date", "en-US")).toEqual({ value: expected });
        expect(parsePastedValue("01/03/2024", "date", "en-US")).toEqual({ value: expected });
        expect(parsePastedValue("03.01.2024", "date", "de-DE")).toEqual({ value: expected });
        expect(parsePastedValue("2024/01/03", "date", "ja-JP")).toEqual({ value: expected });
    });

    it("rejects a date that doesn't exist rather than rolling it over", () => {
        expect(parsePastedValue("2024-02-30", "date", "en-US")).toBeNull();
        expect(parsePastedValue("13/01/2024", "date", "en-US")).toBeNull();
    });

    it("clears a number, date or true/false cell with empty text", () => {
        expect(parsePastedValue("", "number", "en-US")).toEqual({ value: null });
        expect(parsePastedValue(" ", "date", "en-US")).toEqual({ value: null });
        expect(parsePastedValue("", "boolean", "en-US")).toEqual({ value: null });
    });
});
