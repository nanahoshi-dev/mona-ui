import { describe, expect, it } from "vitest";
import { formatIcuMessage, type IcuValue } from "./format-icu-message";
import { IcuSyntaxError, parseIcuMessage } from "./icu-message-parser";

function format(source: string, values: Record<string, IcuValue> = {}, localeId = "en-US"): string {
    return formatIcuMessage(parseIcuMessage(source), new Map(Object.entries(values)), localeId);
}

function syntaxError(source: string): IcuSyntaxError {
    try {
        parseIcuMessage(source);
    } catch (error) {
        if (error instanceof IcuSyntaxError) {
            return error;
        }
        throw error;
    }
    throw new Error(`Expected "${source}" to be rejected`);
}

describe("parseIcuMessage", () => {
    it("parses literals and arguments", () => {
        expect(parseIcuMessage("Page {page} of { total }")).toEqual([
            { kind: "literal", value: "Page " },
            { kind: "argument", name: "page" },
            { kind: "literal", value: " of " },
            { kind: "argument", name: "total" }
        ]);
    });

    it("parses an empty message", () => {
        expect(parseIcuMessage("")).toEqual([]);
    });

    it("parses number arguments with their styles", () => {
        expect(parseIcuMessage("{a, number}")).toEqual([{ kind: "number", name: "a" }]);
        expect(parseIcuMessage("{a, number, integer}")).toEqual([
            { kind: "number", name: "a", options: { maximumFractionDigits: 0 } }
        ]);
        expect(parseIcuMessage("{a, number, percent}")).toEqual([
            { kind: "number", name: "a", options: { style: "percent" } }
        ]);
        expect(parseIcuMessage("{a, number, ::group-off precision-integer}")).toEqual([
            { kind: "number", name: "a", options: { maximumFractionDigits: 0, useGrouping: false } }
        ]);
    });

    it("parses plural with offset, exact selectors and categories", () => {
        const [element] = parseIcuMessage("{n, plural, offset:1 =0 {none} one {# one} other {# more}}");

        expect(element).toMatchObject({ kind: "plural", name: "n", offset: 1, ordinal: false });
        expect(element.kind === "plural" && [...element.options.keys()]).toEqual(["=0", "one", "other"]);
    });

    it("parses selectordinal and select", () => {
        expect(parseIcuMessage("{n, selectordinal, one {#st} other {#th}}")[0]).toMatchObject({ ordinal: true });
        expect(parseIcuMessage("{g, select, female {she} other {they}}")[0]).toMatchObject({ kind: "select" });
    });

    it("treats # as literal outside a plural", () => {
        expect(parseIcuMessage("Item #{n}")).toEqual([
            { kind: "literal", value: "Item #" },
            { kind: "argument", name: "n" }
        ]);
    });

    it("applies apostrophe quoting", () => {
        expect(format("It''s")).toBe("It's");
        expect(format("Don't")).toBe("Don't");
        expect(format("'{literal}'")).toBe("{literal}");
        expect(format("'{it''s}'")).toBe("{it's}");
        expect(format("{n, plural, other {'#' is #}}", { n: 3 })).toBe("# is 3");
        expect(format("'#' stays")).toBe("'#' stays");
    });

    it.each([
        ["{", "Expected an argument name"],
        ["{page", 'Expected "," but the message ended'],
        ["{page, date}", 'Unsupported argument type "date"'],
        ["{page, time, short}", 'Unsupported argument type "time"'],
        ["text }", 'Unexpected "}"'],
        ["{1}", "Expected an argument name"],
        ["{n, number, currency}", 'Unsupported number style "currency"'],
        ["{n, number, ::compact-short}", 'Unsupported number skeleton "compact-short"'],
        ["{n, plural, lots {x} other {y}}", 'Unknown plural category "lots"'],
        ["{n, plural, one {x} one {y} other {z}}", 'Duplicate selector "one"'],
        ["{n, plural, one x other {y}}", 'Expected "{"'],
        ["{n, plural, one {x} other {y}", 'Expected "}" but the message ended'],
        ["{n, select, a {x}", 'Expected "}" but the message ended']
    ])("rejects %s", (source, message) => {
        const error = syntaxError(source);

        expect(error.kind).toBe("syntax");
        expect(error.message).toContain(message);
    });

    it("reports a plural or select without other", () => {
        expect(syntaxError("{n, plural, one {x}}").kind).toBe("missing-other");
        expect(syntaxError("{g, select, a {x}}").kind).toBe("missing-other");
    });

    it("reports the position of an error", () => {
        expect(syntaxError("Hello {name, date}").offset).toBe(13);
    });

    it("rejects arguments nested too deeply", () => {
        const deep = "{a, select, other {".repeat(20) + "x" + "}}".repeat(20);

        expect(syntaxError(deep).message).toContain("nested more than");
    });
});

describe("formatIcuMessage", () => {
    it("formats numbers with the locale's digits and grouping", () => {
        expect(format("{n}", { n: 12345 }, "de-DE")).toBe("12.345");
        expect(format("{n, number}", { n: 12345.5 }, "en-US")).toBe("12,345.5");
        expect(format("{n, number, ::group-off}", { n: 2026 }, "de-DE")).toBe("2026");
        expect(format("{n, number, integer}", { n: 3.7 }, "en-US")).toBe("4");
        expect(format("{n, number, percent}", { n: 0.25 }, "en-US")).toBe("25%");
        expect(format("{n}", { n: 5 }, "ar-EG")).toBe("٥");
    });

    it("formats strings as they are and absent arguments as empty", () => {
        expect(format("[{a}]", { a: "x" })).toBe("[x]");
        expect(format("[{a}]")).toBe("[]");
    });

    it("selects plural forms by the locale's rules", () => {
        const source = "{n, plural, one {# файл} few {# файла} many {# файлов} other {# файла}}";

        expect([1, 2, 5, 21, 22, 25, 1.5].map(n => format(source, { n }, "ru-RU"))).toEqual([
            "1 файл",
            "2 файла",
            "5 файлов",
            "21 файл",
            "22 файла",
            "25 файлов",
            "1,5 файла"
        ]);
    });

    it("prefers an exact selector and applies the offset to the category and #", () => {
        const source = "{n, plural, offset:1 =0 {nobody} =1 {only you} one {you and # other} other {you and # others}}";

        expect([0, 1, 2, 3].map(n => format(source, { n }))).toEqual([
            "nobody",
            "only you",
            "you and 1 other",
            "you and 2 others"
        ]);
    });

    it("formats ordinals", () => {
        const source = "{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}";

        expect([1, 2, 3, 4, 11, 21].map(n => format(source, { n }))).toEqual([
            "1st",
            "2nd",
            "3rd",
            "4th",
            "11th",
            "21st"
        ]);
    });

    it("selects by value, with undefined for an absent or empty argument", () => {
        const source = "{label, select, undefined {Remove item} other {Remove {label}}}";

        expect(format(source, { label: "Apple" })).toBe("Remove Apple");
        expect(format(source, {})).toBe("Remove item");
        expect(format(source, { label: "" })).toBe("Remove item");
        expect(format(source, { label: "undefined" })).toBe("Remove undefined");
        expect(format("{g, select, a {A} other {O}}", { g: "a" })).toBe("A");
    });

    it("resolves # to the innermost plural, also inside a nested select", () => {
        const source = "{n, plural, other {{g, select, a {# a} other {# o}}}}";

        expect(format(source, { g: "a", n: 1200 })).toBe("1,200 a");
    });
});
