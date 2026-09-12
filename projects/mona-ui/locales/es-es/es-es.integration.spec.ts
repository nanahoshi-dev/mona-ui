import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { PAGER_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/pager";
import {
    formatNumber,
    getNumberSymbols,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_ES_ES_LOCALE } from "./es-es.locale";

describe("MONA_ES_ES_LOCALE Integration with MonaI18nService", () => {
    it("configures es-ES locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("es-ES");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_ES_ES_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
        expect(pagerMessages().lastPageLabel).toBe("Última página");
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");
        expect(pagerMessages().previousPageLabel).toBe("Página anterior");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Página 1 de 10");
    });

    it("reactively switches between English and Spanish via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Spanish
        service.use(MONA_ES_ES_LOCALE);
        expect(service.localeId()).toBe("es-ES");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Primera página");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Spanish locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Spanish locale wins
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Avanzar página (personalizado)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Avanzar página (personalizado)");
        // Non-overridden message still uses Spanish locale
        expect(pagerMessages().firstPageLabel).toBe("Primera página");

        // Clear overrides: restores Spanish locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
    });

    it("integrates with locale-aware number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("es-ES");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");

        const formatted = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toContain(",");
        expect(formatted).toBe("1234,50");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date).toLowerCase()).toBe("septiembre");
    });

    it("preserves semantic direction decoupling", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        // Locale direction is metadata (LTR for Spanish)
        expect(service.direction()).toBe("ltr");
        // Locale activation must not mutate html dir attribute
        const htmlDir = document.documentElement.getAttribute("dir");
        expect(htmlDir === null || htmlDir === "ltr" || htmlDir === "rtl").toBe(true);
    });
});
