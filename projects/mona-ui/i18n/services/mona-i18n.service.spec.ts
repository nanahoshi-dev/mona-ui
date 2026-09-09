import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import type { MonaPagerMessages } from "../message-types/pager.messages";
import type { MonaLocale } from "../models/mona-locale";
import { provideMonaI18n } from "../providers/provide-mona-i18n";
import { formatNumber, getNumberFormatter } from "../utilities/locale-formatters";
import { mergeMessages } from "../utilities/merge-messages";
import { MonaI18nService } from "./mona-i18n.service";

const SAMPLE_PAGER_FALLBACK: MonaPagerMessages = {
    firstPageLabel: "First page",
    jumpBackwardLabel: pages => `Jump back ${pages} pages`,
    jumpForwardLabel: pages => `Jump forward ${pages} pages`,
    lastPageLabel: "Last page",
    nextPageLabel: "Next page",
    ofText: "of",
    pageLabel: page => `Page ${page}`,
    pageSizeLabel: pageSize => `${pageSize} / page`,
    pageText: "Page",
    previousPageLabel: "Previous page",
    rangeLabel: (start, end, total) => `${start} - ${end} of ${total} items`
};

const SAMPLE_TR_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "tr-TR",
    messages: {
        pager: {
            firstPageLabel: "İlk sayfa",
            jumpBackwardLabel: pages => `${pages} sayfa geri git`,
            nextPageLabel: "Sonraki sayfa",
            pageLabel: page => `Sayfa ${page}`
        }
    }
};

const SAMPLE_AR_LOCALE: MonaLocale = {
    direction: "rtl",
    id: "ar-SA",
    messages: {}
};

describe("MonaI18nService", () => {
    it("provides en-US default locale and ltr direction when no config is provided", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");
        expect(service.locale().id).toBe("en-US");
    });

    it("accepts custom initial locale and message overrides via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: SAMPLE_TR_LOCALE,
                    messages: {
                        pager: {
                            nextPageLabel: "Özel Sonraki Sayfa"
                        }
                    }
                })
            ]
        });
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("tr-TR");
        expect(service.direction()).toBe("ltr");

        const messages = service.componentMessages("pager", SAMPLE_PAGER_FALLBACK);
        // App override takes precedence over locale pack
        expect(messages().nextPageLabel).toBe("Özel Sonraki Sayfa");
        // Locale pack takes precedence over fallback
        expect(messages().firstPageLabel).toBe("İlk sayfa");
        // Fallback is used when neither override nor locale defines it
        expect(messages().lastPageLabel).toBe("Last page");
    });

    it("updates signals reactively when use() is called", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        service.use(SAMPLE_AR_LOCALE);
        expect(service.localeId()).toBe("ar-SA");
        expect(service.direction()).toBe("rtl");

        service.use(SAMPLE_TR_LOCALE);
        expect(service.localeId()).toBe("tr-TR");
        expect(service.direction()).toBe("ltr");
    });

    it("updates messages reactively when setMessages() is called", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        const messages = service.componentMessages("pager", SAMPLE_PAGER_FALLBACK);
        expect(messages().nextPageLabel).toBe("Next page");

        service.setMessages({
            pager: {
                nextPageLabel: "Go Forward"
            }
        });

        expect(messages().nextPageLabel).toBe("Go Forward");
        expect(messages().previousPageLabel).toBe("Previous page");
    });

    it("merges messages with correct precedence: override > locale > fallback", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);
        service.use(SAMPLE_TR_LOCALE);

        const messages = service.componentMessages("pager", SAMPLE_PAGER_FALLBACK);
        // Locale overrides fallback
        expect(messages().firstPageLabel).toBe("İlk sayfa");
        expect(messages().pageLabel(5)).toBe("Sayfa 5");
        // Fallback retained
        expect(messages().lastPageLabel).toBe("Last page");

        // Now set override
        service.setMessages({
            pager: {
                firstPageLabel: "En Başa Git"
            }
        });
        // Override takes precedence over locale
        expect(messages().firstPageLabel).toBe("En Başa Git");
        // Locale still active for non-overridden keys
        expect(messages().pageLabel(5)).toBe("Sayfa 5");
    });
});

describe("mergeMessages utility", () => {
    it("returns base when no overrides provided", () => {
        const result = mergeMessages(SAMPLE_PAGER_FALLBACK);
        expect(result).toEqual(SAMPLE_PAGER_FALLBACK);
    });

    it("treats functions as atomic replacements", () => {
        const customPageLabel = (page: number) => `#${page}`;
        const result = mergeMessages(SAMPLE_PAGER_FALLBACK, {
            pageLabel: customPageLabel
        });

        expect(result.pageLabel(3)).toBe("#3");
        expect(result.firstPageLabel).toBe("First page");
    });

    it("does not mutate input objects", () => {
        const fallback = { a: "1", nested: { b: "2" } };
        const locale = { nested: { b: "3" } };
        const result = mergeMessages(fallback, locale);

        expect(result.nested.b).toBe("3");
        expect(fallback.nested.b).toBe("2");
    });
});

describe("locale-formatters utility", () => {
    it("caches number formatter instances", () => {
        const formatter1 = getNumberFormatter("en-US");
        const formatter2 = getNumberFormatter("en-US");
        expect(formatter1).toBe(formatter2);
    });

    it("formats numbers according to specified locale", () => {
        const enResult = formatNumber(1234567.89, "en-US");
        expect(enResult).toBe("1,234,567.89");

        const deResult = formatNumber(1234567.89, "de-DE");
        expect(deResult).toBe("1.234.567,89");
    });
});
