import { describe, expect, it } from "vitest";
import { formatNumber, getNumberSymbols } from "./locale-formatters";
import { canonicalizeLocaleId, MONA_FALLBACK_LOCALE_ID, tryCanonicalizeLocaleId } from "./locale-id";

describe("locale id canonicalization", () => {
    it("canonicalizes valid BCP 47 tags", () => {
        expect(canonicalizeLocaleId("en-us")).toBe("en-US");
        expect(canonicalizeLocaleId(" de-DE ")).toBe("de-DE");
        expect(canonicalizeLocaleId("zh-hant-tw")).toBe("zh-Hant-TW");
        expect(canonicalizeLocaleId("ar-SA-u-nu-arab")).toBe("ar-SA-u-nu-arab");
    });

    it("converts POSIX and Java style ids", () => {
        expect(canonicalizeLocaleId("en_US")).toBe("en-US");
        expect(canonicalizeLocaleId("pt_BR")).toBe("pt-BR");
        expect(canonicalizeLocaleId("de_DE.UTF-8")).toBe("de-DE");
        expect(canonicalizeLocaleId("de_DE@euro")).toBe("de-DE");
    });

    it("resolves empty and malformed ids to the fallback", () => {
        for (const id of ["", "   ", "invalid---locale", "en US", "C", null, undefined]) {
            expect(tryCanonicalizeLocaleId(id), String(id)).toBeNull();
            expect(canonicalizeLocaleId(id), String(id)).toBe(MONA_FALLBACK_LOCALE_ID);
        }
    });

    it("lets number helpers use the intended locale for POSIX ids", () => {
        expect(formatNumber(1234.5, "de_DE")).toBe("1.234,5");
        expect(getNumberSymbols("de_DE").decimal).toBe(",");
        expect(formatNumber(1234.5, "invalid---locale")).toBe("1,234.5");
    });
});
