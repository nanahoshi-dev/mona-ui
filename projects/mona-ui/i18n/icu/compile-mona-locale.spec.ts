import { isDevMode } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MonaI18nService, provideMonaI18n, type MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileMonaLocale, MonaLocaleDataError, validateMonaLocaleData } from "./compile-mona-locale";
import type { MonaLocaleData } from "./models/mona-locale-data";

const PAGER_FALLBACK: MonaPagerMessages = {
    firstPageLabel: "First page",
    jumpBackwardLabel: pages => `Jump back ${pages} pages`,
    jumpForwardLabel: pages => `Jump forward ${pages} pages`,
    lastPageLabel: "Last page",
    nextPageLabel: "Next page",
    ofText: "of",
    pageLabel: page => `Page ${page}`,
    pageSizeLabel: pageSize => `${pageSize} / page`,
    pageStatus: (page, totalPages) => `Page ${page} of ${totalPages}`,
    pageText: "Page",
    previousPageLabel: "Previous page",
    rangeStatus: (start, end, total) => `${start} - ${end} of ${total} items`
};

const DE_DATA: MonaLocaleData = {
    direction: "ltr",
    id: "de-DE",
    messages: {
        pager: {
            jumpForwardLabel: "{pages, plural, one {Um # Seite vorspringen} other {Um # Seiten vorspringen}}",
            nextPageLabel: "Nächste Seite",
            pageStatus: "Seite {page, number} von {totalPages, number}"
        }
    }
};

function issueCodes(data: unknown): string[] {
    return validateMonaLocaleData(data).map(issue => `${issue.code} ${issue.path}`);
}

describe("compileMonaLocale", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("compiles plain messages to strings and parameterized messages to functions", () => {
        const locale = compileMonaLocale(DE_DATA);
        const pager = locale.messages.pager!;

        expect(locale.id).toBe("de-DE");
        expect(locale.direction).toBe("ltr");
        expect(pager.nextPageLabel).toBe("Nächste Seite");
        expect(pager.pageStatus!(1200, 3400)).toBe("Seite 1.200 von 3.400");
        expect(pager.jumpForwardLabel!(1)).toBe("Um 1 Seite vorspringen");
        expect(pager.jumpForwardLabel!(5)).toBe("Um 5 Seiten vorspringen");
    });

    it("passes arguments by the message's parameter order", () => {
        const locale = compileMonaLocale({
            direction: "ltr",
            id: "en-US",
            messages: { pager: { rangeStatus: "{total} total, showing {start} to {end}" } }
        });

        expect(locale.messages.pager!.rangeStatus!(1, 10, 95)).toBe("95 total, showing 1 to 10");
    });

    it("leaves optional parameters out when they are not passed", () => {
        const locale = compileMonaLocale({
            direction: "ltr",
            id: "de-DE",
            messages: {
                chip: { removeLabel: "{label, select, undefined {Element entfernen} other {{label} entfernen}}" }
            }
        });
        const removeLabel = locale.messages.chip!.removeLabel!;

        expect(removeLabel()).toBe("Element entfernen");
        expect(removeLabel("Apfel")).toBe("Apfel entfernen");
    });

    it("formats numbers with the locale's digits", () => {
        const locale = compileMonaLocale({
            direction: "rtl",
            id: "ar-EG",
            messages: { pager: { pageLabel: "الصفحة {page}" } }
        });

        expect(locale.messages.pager!.pageLabel!(12)).toBe("الصفحة ١٢");
    });

    it("unescapes apostrophes in plain messages", () => {
        const locale = compileMonaLocale({
            direction: "ltr",
            id: "fr-FR",
            messages: { pager: { nextPageLabel: "Page suivante '{'→'}' l''autre" } }
        });

        expect(locale.messages.pager!.nextPageLabel).toBe("Page suivante {→} l'autre");
    });

    it("works with MonaI18nService and falls back to English for skipped messages", () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const locale = compileMonaLocale({
            ...DE_DATA,
            messages: { pager: { ...DE_DATA.messages.pager, previousPageLabel: "{broken" } }
        });
        TestBed.configureTestingModule({ providers: [provideMonaI18n({ locale })] });
        const pager = TestBed.inject(MonaI18nService).componentMessages("pager", PAGER_FALLBACK)();

        expect(pager.nextPageLabel).toBe("Nächste Seite");
        expect(pager.previousPageLabel).toBe("Previous page");
        expect(pager.pageStatus(2, 9)).toBe("Seite 2 von 9");
    });

    it("warns in dev mode and skips messages with issues", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const locale = compileMonaLocale({
            direction: "ltr",
            id: "de-DE",
            messages: { pager: { nextPageLabel: "Weiter", pageLabel: "Seite {pageNumber}" } }
        });

        expect(locale.messages.pager).toEqual({ nextPageLabel: "Weiter" });
        expect(isDevMode()).toBe(true);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][1]).toEqual([expect.objectContaining({ code: "unknown-parameter" })]);
    });

    it("throws every issue in strict mode", () => {
        const data = {
            direction: "up",
            id: "de-DE",
            messages: { pager: { nextPageLabel: 1, pageLabel: "{page, plural, one {x}}" } }
        } as unknown as MonaLocaleData;

        expect(() => compileMonaLocale(data, { strict: true })).toThrow(MonaLocaleDataError);
        try {
            compileMonaLocale(data, { strict: true });
        } catch (error) {
            expect((error as MonaLocaleDataError).issues.map(issue => issue.code)).toEqual([
                "invalid-direction",
                "not-a-string",
                "missing-other"
            ]);
            expect((error as Error).message).toContain("messages.pager.pageLabel");
        }
    });

    it("does not throw in strict mode for valid data", () => {
        expect(() => compileMonaLocale(DE_DATA, { strict: true })).not.toThrow();
    });
});

describe("validateMonaLocaleData", () => {
    it("returns no issues for valid data", () => {
        expect(validateMonaLocaleData(DE_DATA)).toEqual([]);
    });

    it("rejects data that is not a locale object", () => {
        expect(issueCodes(null)).toEqual(["invalid-structure "]);
        expect(issueCodes([])).toEqual(["invalid-structure "]);
        expect(issueCodes({ direction: "ltr", id: "de-DE", messages: "x" })).toEqual(["invalid-structure messages"]);
    });

    it("rejects an invalid id and direction", () => {
        expect(issueCodes({ direction: "ltr", id: "not a locale", messages: {} })).toEqual(["invalid-id id"]);
        expect(issueCodes({ id: "de-DE", messages: {} })).toEqual(["invalid-direction direction"]);
    });

    it("reports unknown namespaces and keys, including prototype names", () => {
        const data = JSON.parse(
            '{"direction":"ltr","id":"de-DE","messages":{"pagr":{},"__proto__":{},"pager":{"nextPage":"x","toString":"y","constructor":"z"},"chip":"x"}}'
        );

        expect(issueCodes(data)).toEqual([
            "unknown-namespace messages.pagr",
            "unknown-namespace messages.__proto__",
            "unknown-key messages.pager.nextPage",
            "unknown-key messages.pager.toString",
            "unknown-key messages.pager.constructor",
            "invalid-structure messages.chip"
        ]);
    });

    it("reports syntax errors, unknown parameters and parameter types", () => {
        const data = {
            direction: "ltr",
            id: "en-US",
            messages: {
                grid: { filterByColumn: "{column, plural, other {x}}" },
                pager: {
                    nextPageLabel: "Next {page}",
                    pageLabel: "{page, date}",
                    pageStatus: "{page} of {pages}",
                    rangeStatus: "{total, select, other {{start, number, percent} {missing}}}"
                }
            }
        };

        expect(issueCodes(data)).toEqual([
            "parameter-type messages.grid.filterByColumn",
            "unknown-parameter messages.pager.nextPageLabel",
            "syntax messages.pager.pageLabel",
            "unknown-parameter messages.pager.pageStatus",
            "unknown-parameter messages.pager.rangeStatus"
        ]);
    });
});
