import ts from "typescript";
import { describe, expect, it } from "vitest";
import { parseIcuMessage } from "../projects/mona-ui/i18n/icu/parser/icu-message-parser";
import { createUsage, DEFAULT_CATALOG_TARGETS, emitFunction, emitMessage } from "./generate-locale-catalogs";
import type { MessageParameterInfo } from "./generate-message-parameters";

const number = (name: string): MessageParameterInfo => ({ name, optional: false, type: "number" });
const text = (name: string, optional = false): MessageParameterInfo => ({ name, optional, type: "string" });

/** Emits a message function and compiles it, with the helpers a generated catalog declares. */
function compile(
    source: string,
    parameters: readonly MessageParameterInfo[],
    localeId = "en-US"
): { readonly code: string; readonly run: (...args: unknown[]) => string } {
    const code = emitFunction(source, parameters, localeId, createUsage());
    const javascript = ts.transpileModule(`const message = ${code};`, {
        compilerOptions: { target: ts.ScriptTarget.ES2022 }
    }).outputText;
    const factory = new Function(
        "localizeNumber",
        "plural",
        "PLURAL_RULES",
        "ORDINAL_RULES",
        `${javascript}\nreturn message;`
    ) as (...helpers: unknown[]) => (...args: unknown[]) => string;
    const run = factory(
        (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(localeId, options).format(value),
        (category: string, forms: Record<string, () => string>) => (forms[category] ?? forms["other"])(),
        new Intl.PluralRules(localeId),
        new Intl.PluralRules(localeId, { type: "ordinal" })
    );
    return { code, run };
}

function emitPlain(source: string): string {
    return emitMessage(parseIcuMessage(source), {
        localeId: "en-US",
        parameters: [],
        pound: null,
        present: new Set(),
        usage: createUsage()
    });
}

describe("generate-locale-catalogs emitter", () => {
    it("emits plain messages as string literals, unescaping ICU quotes", () => {
        expect(emitPlain("Next page")).toBe('"Next page"');
        expect(emitPlain("It''s '{'here'}'")).toBe('"It\'s {here}"');
        expect(emitPlain("")).toBe('""');
    });

    it("escapes template syntax and irregular whitespace", () => {
        const noBreakSpace = String.fromCharCode(0xa0);
        const { code, run } = compile(`\`{a}\` $'{'x'}' \\ {a}${noBreakSpace}%`, [text("a")]);

        expect(code).toContain("\\" + "u00A0");
        expect(code).not.toContain(noBreakSpace);
        expect(run("v")).toBe(`\`v\` \${x} \\ v${noBreakSpace}%`);
    });

    it("formats numbers with the locale, and with number options", () => {
        const { code, run } = compile(
            "Year {year, number, ::group-off} of {total}",
            [number("year"), number("total")],
            "de-DE"
        );

        expect(code).toBe(
            "(year: number, total: number) => `Year ${localizeNumber(year, { useGrouping: false })} of ${localizeNumber(total)}`"
        );
        expect(run(2026, 12000)).toBe("Year 2026 of 12.000");
    });

    it("emits =N plurals as conditionals and # as the value", () => {
        const { code, run } = compile("{n, plural, =1 {1 Spalte} other {# Spalten}}", [number("n")], "de-DE");

        expect(code).toBe('(n: number) => n === 1 ? "1 Spalte" : `${localizeNumber(n)} Spalten`');
        expect([1, 0, 1500].map(n => run(n))).toEqual(["1 Spalte", "0 Spalten", "1.500 Spalten"]);
    });

    it("uses the plural rules for categories, after the offset", () => {
        const { code, run } = compile(
            "{n, plural, offset:1 =0 {none} one {# more} few {# few} many {# many} other {# other}}",
            [number("n")],
            "ru-RU"
        );

        expect(code).toContain("PLURAL_RULES.select((n - 1))");
        expect([0, 2, 3, 6, 23].map(n => run(n))).toEqual(["none", "1 more", "2 few", "5 many", "22 few"]);
    });

    it("uses the ordinal rules for selectordinal", () => {
        const { code, run } = compile("{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}", [number("n")]);

        expect(code).toContain("ORDINAL_RULES.select(n)");
        expect([1, 2, 3, 4, 11, 22].map(n => run(n))).toEqual(["1st", "2nd", "3rd", "4th", "11th", "22nd"]);
    });

    it("emits an optional-string select as a truthiness check", () => {
        const { code, run } = compile("{label, select, undefined {Remove item} other {Remove {label}}}", [
            text("label", true)
        ]);

        expect(code).toBe('(label?: string) => label ? `Remove ${label}` : "Remove item"');
        expect([undefined, "", "Apple"].map(label => run(label))).toEqual([
            "Remove item",
            "Remove item",
            "Remove Apple"
        ]);
    });

    it("selects by value, never matching a prototype name", () => {
        const { run } = compile("{g, select, a {A} b {B} other {O}}", [text("g")]);

        expect(["a", "b", "c", "constructor", "toString"].map(g => run(g))).toEqual(["A", "B", "O", "O", "O"]);
    });

    it("emits an absent optional argument as empty", () => {
        const { code, run } = compile("{rowLabel}. {hint}", [text("rowLabel"), text("hint", true)]);

        expect(code).toContain('${hint ?? ""}');
        expect(run("Row", undefined)).toBe("Row. ");
    });

    it("prefixes parameters a translation does not use", () => {
        expect(compile("Remove", [text("label", true)]).code).toBe('(_label?: string) => "Remove"');
    });

    it("targets each namespace once", () => {
        const namespaces = DEFAULT_CATALOG_TARGETS.map(target => target.namespace);

        expect(new Set(namespaces).size).toBe(namespaces.length);
        expect(namespaces).toHaveLength(44);
    });
});
