import { describe, expect, it } from "vitest";
import { generatePseudoLocale, pseudoLocalize, pseudoLocalizeCatalog } from "./pseudo-locale";

describe("pseudo-locale utilities", () => {
    describe("pseudoLocalize", () => {
        it("transforms ASCII letters to accented glyphs and wraps with delimiters", () => {
            const input = "Apply";
            const output = pseudoLocalize(input, { expand: false });

            expect(output.startsWith("[!! ")).toBe(true);
            expect(output.endsWith(" !!]")).toBe(true);
            // "Apply" characters are mapped to pseudo glyphs
            expect(output).toContain("Å");
            expect(output).toContain("þ");
            expect(output).toContain("ļ");
            expect(output).toContain("ŷ");
        });

        it("expands text length by default expansion factor", () => {
            const input = "Filter";
            const unexpanded = pseudoLocalize(input, { expand: false });
            const expanded = pseudoLocalize(input, { expand: true });

            expect(expanded.length).toBeGreaterThan(unexpanded.length);
            expect(expanded).toContain("~");
        });

        it("supports custom prefix, suffix, and expansion factor", () => {
            const input = "Save";
            const output = pseudoLocalize(input, {
                prefix: "[[[",
                suffix: "]]]",
                expand: true,
                expansionFactor: 0.5
            });

            expect(output.startsWith("[[[")).toBe(true);
            expect(output.endsWith("]]]")).toBe(true);
            expect(output).toContain("Š");
        });

        it("preserves placeholders and parameters intact", () => {
            const input = "Page {page} of {total}";
            const output = pseudoLocalize(input, { expand: false });

            expect(output).toContain("{page}");
            expect(output).toContain("{total}");
            expect(output).toContain("Þ");
            expect(output).toContain("ö");
        });

        it("preserves HTML tags intact", () => {
            const input = "Click <b>here</b> for details";
            const output = pseudoLocalize(input, { expand: false });

            expect(output).toContain("<b>");
            expect(output).toContain("</b>");
        });

        it("does not double-wrap if already pseudo-localized", () => {
            const once = pseudoLocalize("Test");
            const twice = pseudoLocalize(once);

            expect(twice).toBe(once);
        });

        it("handles empty or non-string inputs safely", () => {
            expect(pseudoLocalize("")).toBe("");
            // @ts-expect-error testing invalid runtime value
            expect(pseudoLocalize(null)).toBe(null);
        });
    });

    describe("pseudoLocalizeCatalog", () => {
        it("transforms string properties in a catalog", () => {
            const catalog = {
                apply: "Apply",
                clear: "Clear"
            };
            const pseudo = pseudoLocalizeCatalog(catalog, { expand: false });

            expect(pseudo.apply).toContain("Å");
            expect(pseudo.clear).toContain("Ç");
            expect(pseudo.apply.startsWith("[!! ")).toBe(true);
        });

        it("wraps message functions so their output is pseudo-localized when called", () => {
            const catalog = {
                pageLabel: (page: number) => `Page ${page}`,
                itemsCount: (count: number, total: number) => `${count} of ${total} items`
            };
            const pseudo = pseudoLocalizeCatalog(catalog, { expand: false });

            const pageRes = pseudo.pageLabel(3);
            expect(pageRes.startsWith("[!! ")).toBe(true);
            expect(pageRes).toContain("3");
            expect(pageRes).toContain("Þ");

            const countRes = pseudo.itemsCount(5, 20);
            expect(countRes.startsWith("[!! ")).toBe(true);
            expect(countRes).toContain("5");
            expect(countRes).toContain("20");
        });

        it("recursively transforms nested objects", () => {
            const catalog = {
                nested: {
                    title: "Nested Title"
                }
            };
            const pseudo = pseudoLocalizeCatalog(catalog, { expand: false });

            expect(pseudo.nested.title.startsWith("[!! ")).toBe(true);
            expect(pseudo.nested.title).toContain("Ţ");
        });
    });

    describe("generatePseudoLocale", () => {
        it("generates a full MonaLocale object with en-XA defaults", () => {
            const locale = generatePseudoLocale(
                {
                    pager: {
                        firstPageLabel: "First page",
                        nextPageLabel: "Next page",
                        pageLabel: (p: number) => `Page ${p}`
                    }
                },
                { pseudoOptions: { expand: false } }
            );

            expect(locale.id).toBe("en-XA");
            expect(locale.direction).toBe("ltr");
            expect(locale.messages.pager?.firstPageLabel).toContain("Ƒ");
            expect(locale.messages.pager?.nextPageLabel).toContain("Ñ");

            const pageFn = locale.messages.pager?.pageLabel;
            expect(typeof pageFn).toBe("function");
            if (typeof pageFn === "function") {
                expect(pageFn(10)).toContain("10");
                expect(pageFn(10)).toContain("Þ");
            }
        });

        it("supports custom locale ID and direction", () => {
            const locale = generatePseudoLocale(
                {
                    pager: {
                        firstPageLabel: "First"
                    }
                },
                {
                    direction: "rtl",
                    id: "pseudo-rtl"
                }
            );

            expect(locale.id).toBe("pseudo-rtl");
            expect(locale.direction).toBe("rtl");
        });
    });
});
