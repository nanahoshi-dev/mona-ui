import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { parseGregorianDate } from "./gregorian-date";
import {
    getLocaleDateInputFormat,
    getLocaleDateTimeInputFormat,
    getLocaleFirstDayOfWeek,
    getLocaleTimeInputFormat
} from "./locale-date-formats";
import {
    CLDR_LIKELY_SUBTAGS_VERSION,
    CLDR_WEEK_DATA_VERSION,
    resolveExplicitFirstDayOverride,
    resolveFallbackFirstDayOfWeek,
    resolveLikelyFirstDayOfWeek,
    resolveLikelyRegion,
    resolveLocaleFirstDayOfWeek
} from "./locale-week-data";

describe("locale-date-formats", () => {
    describe("getLocaleDateInputFormat", () => {
        it("returns Japanese year/month/day format for ja-JP", () => {
            const format = getLocaleDateInputFormat("ja-JP");
            expect(format).toBe("yyyy/MM/dd");
        });

        it("returns Chinese year/month/day format for zh-CN and zh-TW", () => {
            expect(getLocaleDateInputFormat("zh-CN")).toBe("yyyy/MM/dd");
            expect(getLocaleDateInputFormat("zh-TW")).toBe("yyyy/MM/dd");
        });

        it("returns Korean year. month. day. format for ko-KR", () => {
            const format = getLocaleDateInputFormat("ko-KR");
            expect(format).toBe("yyyy. MM. dd.");
        });

        it("returns US month/day/year format for en-US", () => {
            const format = getLocaleDateInputFormat("en-US");
            expect(format).toBe("MM/dd/yyyy");
        });

        it("returns German day.month.year format for de-DE", () => {
            const format = getLocaleDateInputFormat("de-DE");
            expect(format).toBe("dd.MM.yyyy");
        });

        it("returns day/month/year format for pt-BR, es-ES, and fr-FR", () => {
            expect(getLocaleDateInputFormat("pt-BR")).toBe("dd/MM/yyyy");
            expect(getLocaleDateInputFormat("es-ES")).toBe("dd/MM/yyyy");
            expect(getLocaleDateInputFormat("fr-FR")).toBe("dd/MM/yyyy");
        });

        it("falls back gracefully for invalid or empty locale", () => {
            expect(getLocaleDateInputFormat("")).toBe("dd/MM/yyyy");
            expect(getLocaleDateInputFormat("invalid-locale-!!!")).toBe("dd/MM/yyyy");
        });
    });

    describe("getLocaleTimeInputFormat", () => {
        it("returns 24-hour HH:mm by default without seconds", () => {
            expect(getLocaleTimeInputFormat("ja-JP")).toBe("HH:mm");
            expect(getLocaleTimeInputFormat("en-US")).toBe("HH:mm");
            expect(getLocaleTimeInputFormat("de-DE")).toBe("HH:mm");
        });

        it("returns 24-hour HH:mm:ss when showSeconds is true", () => {
            expect(getLocaleTimeInputFormat("ja-JP", { hourFormat: "24", showSeconds: true })).toBe("HH:mm:ss");
            expect(getLocaleTimeInputFormat("en-US", { hourFormat: "24", showSeconds: true })).toBe("HH:mm:ss");
        });

        it("returns Japanese 12-hour ahh:mm with day period in prefix position", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("ahh:mm");
        });

        it("returns Japanese 12-hour ahh:mm:ss with day period in prefix position when showSeconds is true", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: true });
            expect(format).toBe("ahh:mm:ss");
        });

        it("returns Chinese 12-hour ahh:mm with day period in prefix position for zh-CN and zh-TW", () => {
            expect(getLocaleTimeInputFormat("zh-CN", { hourFormat: "12", showSeconds: false })).toBe("ahh:mm");
            expect(getLocaleTimeInputFormat("zh-TW", { hourFormat: "12", showSeconds: false })).toBe("ahh:mm");
        });

        it("returns Chinese 12-hour ahh:mm:ss with day period in prefix position when showSeconds is true", () => {
            expect(getLocaleTimeInputFormat("zh-CN", { hourFormat: "12", showSeconds: true })).toBe("ahh:mm:ss");
            expect(getLocaleTimeInputFormat("zh-TW", { hourFormat: "12", showSeconds: true })).toBe("ahh:mm:ss");
        });

        it("returns Korean 12-hour a hh:mm with day period in prefix position for ko-KR", () => {
            const format = getLocaleTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("a hh:mm");
        });

        it("returns Korean 12-hour a hh:mm:ss with day period in prefix position when showSeconds is true", () => {
            const format = getLocaleTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: true });
            expect(format).toBe("a hh:mm:ss");
        });

        it("returns English 12-hour hh:mm a with day period in suffix position", () => {
            const format = getLocaleTimeInputFormat("en-US", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("hh:mm a");
        });

        it("returns English 12-hour hh:mm:ss a when showSeconds is true", () => {
            const format = getLocaleTimeInputFormat("en-US", { hourFormat: "12", showSeconds: true });
            expect(format).toBe("hh:mm:ss a");
        });
    });

    describe("getLocaleDateTimeInputFormat", () => {
        it("derives combined Japanese date and time format in 24h", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "24", showSeconds: false });
            expect(format).toBe("yyyy/MM/dd HH:mm");
        });

        it("derives combined Japanese date and time format in 12h with day period in native position", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("yyyy/MM/dd ahh:mm");
        });

        it("derives combined Chinese date and time format in 24h for zh-CN and zh-TW", () => {
            expect(getLocaleDateTimeInputFormat("zh-CN", { hourFormat: "24", showSeconds: false })).toBe("yyyy/MM/dd HH:mm");
            expect(getLocaleDateTimeInputFormat("zh-TW", { hourFormat: "24", showSeconds: false })).toBe("yyyy/MM/dd HH:mm");
        });

        it("derives combined Chinese date and time format in 12h with day period in native position", () => {
            expect(getLocaleDateTimeInputFormat("zh-CN", { hourFormat: "12", showSeconds: false })).toBe("yyyy/MM/dd ahh:mm");
            expect(getLocaleDateTimeInputFormat("zh-TW", { hourFormat: "12", showSeconds: false })).toBe("yyyy/MM/dd ahh:mm");
        });

        it("derives combined Korean date and time format in 24h and 12h for ko-KR", () => {
            expect(getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "24", showSeconds: false })).toBe(
                "yyyy. MM. dd. HH:mm"
            );
            expect(getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "24", showSeconds: true })).toBe(
                "yyyy. MM. dd. HH:mm:ss"
            );
            expect(getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: false })).toBe(
                "yyyy. MM. dd. a hh:mm"
            );
            expect(getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: true })).toBe(
                "yyyy. MM. dd. a hh:mm:ss"
            );
        });

        it("derives combined US date and time format in 12h", () => {
            const format = getLocaleDateTimeInputFormat("en-US", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("MM/dd/yyyy, hh:mm a");
        });

        it("derives combined German date and time format in 24h", () => {
            const format = getLocaleDateTimeInputFormat("de-DE", { hourFormat: "24", showSeconds: false });
            expect(format).toBe("dd.MM.yyyy, HH:mm");
        });

        it("derives combined Brazilian Portuguese date and time format in 24h with comma separator", () => {
            const format = getLocaleDateTimeInputFormat("pt-BR", { hourFormat: "24", showSeconds: false });
            expect(format).toBe("dd/MM/yyyy, HH:mm");
        });

        it("derives combined Brazilian Portuguese date and time format in 12h with comma separator and day period", () => {
            const format = getLocaleDateTimeInputFormat("pt-BR", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("dd/MM/yyyy, hh:mm a");
        });
    });

    describe("getLocaleFirstDayOfWeek", () => {
        describe("cache normalization and anti-poisoning", () => {
            it("does not allow whitespace-bearing locale to poison cache for canonical ja-JP", () => {
                expect(getLocaleFirstDayOfWeek(" ja-JP ")).toBe("sunday");
                expect(getLocaleFirstDayOfWeek("ja-JP")).toBe("sunday");
            });

            it("does not allow whitespace-bearing locale with override to poison cache for canonical tag", () => {
                expect(getLocaleFirstDayOfWeek(" en-US-u-fw-mon ")).toBe("monday");
                expect(getLocaleFirstDayOfWeek("en-US-u-fw-mon")).toBe("monday");
            });
        });

        describe("native week-info path", () => {
            it("returns sunday for Brazilian Portuguese (pt-BR)", () => {
                expect(getLocaleFirstDayOfWeek("pt-BR")).toBe("sunday");
            });

            it("returns sunday for Japanese (ja-JP)", () => {
                expect(getLocaleFirstDayOfWeek("ja-JP")).toBe("sunday");
            });

            it("returns sunday for Korean (ko-KR)", () => {
                expect(getLocaleFirstDayOfWeek("ko-KR")).toBe("sunday");
            });

            it("returns sunday for US English (en-US)", () => {
                expect(getLocaleFirstDayOfWeek("en-US")).toBe("sunday");
            });

            it("returns monday for German (de-DE)", () => {
                expect(getLocaleFirstDayOfWeek("de-DE")).toBe("monday");
            });

            it("returns monday for Spanish (es-ES)", () => {
                expect(getLocaleFirstDayOfWeek("es-ES")).toBe("monday");
            });

            it("returns monday for French (fr-FR)", () => {
                expect(getLocaleFirstDayOfWeek("fr-FR")).toBe("monday");
            });

            it("returns monday for Simplified Chinese (zh-CN)", () => {
                expect(getLocaleFirstDayOfWeek("zh-CN")).toBe("monday");
            });

            it("returns sunday for Traditional Chinese (zh-TW)", () => {
                expect(getLocaleFirstDayOfWeek("zh-TW")).toBe("sunday");
            });

            it("returns saturday for Egyptian Arabic (ar-EG)", () => {
                expect(getLocaleFirstDayOfWeek("ar-EG")).toBe("saturday");
            });

            it("returns friday for Maldives (dv-MV)", () => {
                expect(getLocaleFirstDayOfWeek("dv-MV")).toBe("friday");
            });

            it("falls back to monday safely for unknown locales", () => {
                expect(getLocaleFirstDayOfWeek("")).toBe("monday");
                expect(getLocaleFirstDayOfWeek("xyz-unknown")).toBe("monday");
            });

            it("reads weekInfo accessor when available without getWeekInfo method", () => {
                const originalLocale = Intl.Locale;
                try {
                    class MockLocale extends originalLocale {
                        public get weekInfo(): { firstDay: number } {
                            return { firstDay: 7 };
                        }
                    }
                    (MockLocale.prototype as unknown as { getWeekInfo: unknown }).getWeekInfo = undefined;
                    Object.defineProperty(Intl, "Locale", { value: MockLocale, configurable: true, writable: true });
                    expect(getLocaleFirstDayOfWeek("en-AA")).toBe("sunday");
                } finally {
                    Object.defineProperty(Intl, "Locale", { value: originalLocale, configurable: true, writable: true });
                }
            });

            it("reads getWeekInfo method when weekInfo accessor is undefined", () => {
                const originalLocale = Intl.Locale;
                try {
                    class MockLocale extends originalLocale {
                        public getWeekInfo(): { firstDay: number } {
                            return { firstDay: 7 };
                        }
                    }
                    Object.defineProperty(MockLocale.prototype, "weekInfo", { value: undefined, configurable: true });
                    Object.defineProperty(Intl, "Locale", { value: MockLocale, configurable: true, writable: true });
                    expect(getLocaleFirstDayOfWeek("en-AB")).toBe("sunday");
                } finally {
                    Object.defineProperty(Intl, "Locale", { value: originalLocale, configurable: true, writable: true });
                }
            });
        });

        describe("forced fallback resolution (weekInfo and getWeekInfo unavailable)", () => {
            function withWeekInfoDisabled(fn: () => void): void {
                const originalLocale = Intl.Locale;
                try {
                    class MockDisabledLocale extends originalLocale {
                        public get weekInfo(): undefined {
                            return undefined;
                        }
                    }
                    (MockDisabledLocale.prototype as unknown as { getWeekInfo: unknown }).getWeekInfo = undefined;
                    Object.defineProperty(Intl, "Locale", { value: MockDisabledLocale, configurable: true, writable: true });
                    fn();
                } finally {
                    Object.defineProperty(Intl, "Locale", { value: originalLocale, configurable: true, writable: true });
                }
            }

            it("matches pinned CLDR firstDay expectations across verified regions", () => {
                withWeekInfoDisabled(() => {
                    // AE, AU, CN are Monday-first in CLDR 46+
                    expect(resolveFallbackFirstDayOfWeek("ar-AE")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("en-AU")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("zh-CN")).toBe("monday");

                    // TW, PT, BR, KR, and YE are Sunday-first in CLDR
                    expect(resolveFallbackFirstDayOfWeek("zh-TW")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ko-KR")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("is-IS")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("ar-YE")).toBe("sunday");

                    // PT and BR are Sunday-first in CLDR
                    expect(resolveFallbackFirstDayOfWeek("pt-PT")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("pt-BR")).toBe("sunday");

                    // MV is Friday-first in CLDR
                    expect(resolveFallbackFirstDayOfWeek("dv-MV")).toBe("friday");

                    // Saturday-first regions in CLDR
                    expect(resolveFallbackFirstDayOfWeek("ar-EG")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("fa-IR")).toBe("saturday");
                });
            });

            it("resolves language-only tags through likely subtags without misreading -u-ca-gregory as region CA", () => {
                withWeekInfoDisabled(() => {
                    expect(resolveFallbackFirstDayOfWeek("de")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("ja")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ko")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("pt")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ar")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("fa")).toBe("saturday");

                    // Critical regression test: de with -u-ca-gregory extension must not be interpreted as Canada (CA)
                    expect(resolveFallbackFirstDayOfWeek("de-u-ca-gregory")).toBe("monday");
                    expect(resolveLikelyRegion("de-u-ca-gregory")).toBe("DE");
                });
            });

            it("respects explicit Unicode u-fw-* overrides when week-info API is unavailable", () => {
                withWeekInfoDisabled(() => {
                    expect(resolveFallbackFirstDayOfWeek("en-US-u-fw-mon")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("de-DE-u-fw-sun")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ja-JP-u-fw-mon")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("pt-BR-u-fw-mon")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("ar-EG-u-fw-fri")).toBe("friday");
                    expect(resolveFallbackFirstDayOfWeek("en-US-u-ca-gregory-fw-mon")).toBe("monday");

                    // Unknown or invalid fw values fall through safely to regional lookup
                    expect(resolveFallbackFirstDayOfWeek("en-US-u-fw-invalid")).toBe("sunday");
                });
            });

            it("does not allow -x- private-use payload to override regional week start in fallback mode", () => {
                withWeekInfoDisabled(() => {
                    expect(resolveFallbackFirstDayOfWeek("en-GB-x-u-fw-sun")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("en-US-x-u-fw-mon")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("pt-BR-x-u-fw-mon")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("x-u-fw-sun")).toBe("monday");

                    // Legitimate overrides before private use still take precedence
                    expect(resolveFallbackFirstDayOfWeek("en-GB-u-fw-sun-x-test")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("en-US-u-fw-mon-x-test")).toBe("monday");
                });
            });

            it("ensures public getLocaleFirstDayOfWeek executes fallback when mock is active on an uncached locale", () => {
                withWeekInfoDisabled(() => {
                    // Test with unique locales that were not queried previously in normal-path tests
                    expect(getLocaleFirstDayOfWeek("en-MV")).toBe("friday");
                    expect(getLocaleFirstDayOfWeek("is-IS")).toBe("monday");
                });
            });

            it("proves forced-fallback resolution is isolated from prior normal-path cache entries", () => {
                // 1. Query normal path for en-US
                expect(getLocaleFirstDayOfWeek("en-US")).toBe("sunday");

                // 2. Pure resolver under disabled weekInfo resolves independent targets correctly
                withWeekInfoDisabled(() => {
                    expect(resolveLocaleFirstDayOfWeek("dv-MV")).toBe("friday");
                    expect(resolveLocaleFirstDayOfWeek("ar-YE")).toBe("sunday");
                    expect(resolveLocaleFirstDayOfWeek("ar-AE")).toBe("monday");
                });
            });

            it("correctly resolves likely first day when Intl.Locale is absent but getCanonicalLocales is available", () => {
                const originalIntl = globalThis.Intl;
                try {
                    // Simulate primitive environment without Intl.Locale
                    const mockedIntl = { ...originalIntl };
                    Reflect.deleteProperty(mockedIntl, "Locale");
                    Object.defineProperty(globalThis, "Intl", { value: mockedIntl, configurable: true, writable: true });

                    expect(resolveLikelyRegion("en-US")).toBe("US");
                    expect(resolveLikelyRegion("de-u-ca-gregory")).toBeNull();
                    expect(resolveFallbackFirstDayOfWeek("de-u-ca-gregory")).toBe("monday");

                    // Explicit regions continue to work
                    expect(resolveFallbackFirstDayOfWeek("en-US")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ar-EG")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("dv-MV")).toBe("friday");

                    // Language-only tags resolve via CLDR 46 likely subtags
                    expect(resolveFallbackFirstDayOfWeek("en")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("pt")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("he")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("hi")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ja")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ko")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ar")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("fa")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("dv")).toBe("friday");
                    expect(resolveFallbackFirstDayOfWeek("id")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("th")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ur")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("bn")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("fil")).toBe("sunday");

                    // Language-script tags resolve correctly
                    expect(resolveFallbackFirstDayOfWeek("zh-Hant")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("zh-Hans")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("zh")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("en-Shaw")).toBe("monday");

                    // Monday default languages remain Monday
                    expect(resolveFallbackFirstDayOfWeek("de")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("es")).toBe("monday");
                    // Undefined language fallback
                    expect(resolveFallbackFirstDayOfWeek("und")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Hant")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Hebr")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Arab")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("und-Latn")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Cyrl")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("und-US")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-TW")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-EG")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("und-MV")).toBe("friday");
                } finally {
                    Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true, writable: true });
                }
            });

            it("canonicalizes numeric M49 region codes when Intl.Locale is unavailable but getCanonicalLocales is available", () => {
                const originalIntl = globalThis.Intl;
                try {
                    const mockedIntl = Object.create(originalIntl);
                    Object.defineProperty(mockedIntl, "Locale", { value: undefined, configurable: true });
                    Object.defineProperty(globalThis, "Intl", { value: mockedIntl, configurable: true, writable: true });

                    expect(resolveLikelyRegion("en-840")).toBe("US");
                    expect(resolveLikelyRegion("dv-462")).toBe("MV");
                    expect(resolveLikelyRegion("ar-818")).toBe("EG");
                    expect(resolveLikelyRegion("ja-392")).toBe("JP");

                    expect(resolveFallbackFirstDayOfWeek("en-840")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("dv-462")).toBe("friday");
                    expect(resolveFallbackFirstDayOfWeek("ar-818")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("ja-392")).toBe("sunday");
                } finally {
                    Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true, writable: true });
                }
            });

            it("does not mistake private-use-only tags (e.g. x-US) for region-bearing tags", () => {
                expect(resolveLikelyRegion("x-US")).toBeNull();
                expect(resolveFallbackFirstDayOfWeek("x-US")).toBe("monday");
                expect(resolveLocaleFirstDayOfWeek("x-US")).toBe("monday");

                const originalIntl = globalThis.Intl;
                try {
                    const mockedIntl = Object.create(originalIntl);
                    Object.defineProperty(mockedIntl, "Locale", { value: undefined, configurable: true });
                    Object.defineProperty(globalThis, "Intl", { value: mockedIntl, configurable: true, writable: true });

                    expect(resolveLikelyRegion("x-US")).toBeNull();
                    expect(resolveFallbackFirstDayOfWeek("x-US")).toBe("monday");
                    expect(resolveLocaleFirstDayOfWeek("x-US")).toBe("monday");
                } finally {
                    Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true, writable: true });
                }
            });

            it("handles primitive environment where both Intl.Locale and Intl.getCanonicalLocales are unavailable", () => {
                const originalIntl = globalThis.Intl;
                try {
                    const mockedIntl = Object.create(originalIntl);
                    Object.defineProperty(mockedIntl, "Locale", { value: undefined, configurable: true });
                    Object.defineProperty(mockedIntl, "getCanonicalLocales", { value: undefined, configurable: true });
                    Object.defineProperty(globalThis, "Intl", { value: mockedIntl, configurable: true, writable: true });

                    // Standard alpha-2 regions are parsed directly
                    expect(resolveLikelyRegion("en-US")).toBe("US");
                    expect(resolveLikelyRegion("ar-EG")).toBe("EG");
                    expect(resolveLikelyRegion("dv-MV")).toBe("MV");
                    expect(resolveFallbackFirstDayOfWeek("en-US")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ar-EG")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("dv-MV")).toBe("friday");

                    // Numeric regions cannot be mapped without canonicalization and safely fall back
                    expect(resolveLikelyRegion("en-840")).toBeNull();
                    expect(resolveFallbackFirstDayOfWeek("en-840")).toBe("monday");

                    // Language-only and language-script fallback operates deterministically in fully primitive mode
                    expect(resolveFallbackFirstDayOfWeek("en")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("pt")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("he")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("hi")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ja")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ko")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("ar")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("fa")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("dv")).toBe("friday");
                    expect(resolveFallbackFirstDayOfWeek("zh-Hant")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("zh-Hans")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("de")).toBe("monday");

                    // Undefined language fallback in fully primitive mode
                    expect(resolveFallbackFirstDayOfWeek("und")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Hant")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Hebr")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Arab")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("und-Latn")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-Cyrl")).toBe("monday");
                    expect(resolveFallbackFirstDayOfWeek("und-US")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-TW")).toBe("sunday");
                    expect(resolveFallbackFirstDayOfWeek("und-EG")).toBe("saturday");
                    expect(resolveFallbackFirstDayOfWeek("und-MV")).toBe("friday");

                    // Private use is guarded
                    expect(resolveLikelyRegion("x-US")).toBeNull();
                    expect(resolveFallbackFirstDayOfWeek("x-US")).toBe("monday");
                } finally {
                    Object.defineProperty(globalThis, "Intl", { value: originalIntl, configurable: true, writable: true });
                }
            });

            it("verifies native Intl.Locale likely region aligns with pinned fallback for curated locales", () => {
                const curated = [
                    { locale: "und", expected: "sunday" },
                    { locale: "und-Hant", expected: "sunday" },
                    { locale: "und-Hebr", expected: "sunday" },
                    { locale: "und-Arab", expected: "saturday" },
                    { locale: "und-Latn", expected: "sunday" },
                    { locale: "und-Cyrl", expected: "monday" },
                    { locale: "en", expected: "sunday" },
                    { locale: "ja", expected: "sunday" },
                    { locale: "ar", expected: "saturday" },
                    { locale: "zh-Hant", expected: "sunday" },
                    { locale: "en-Shaw", expected: "monday" }
                ];
                for (const item of curated) {
                    expect(resolveFallbackFirstDayOfWeek(item.locale)).toBe(item.expected);
                }
            });

            it("verifies CLDR version synchronization", () => {
                expect(CLDR_LIKELY_SUBTAGS_VERSION).toBe(CLDR_WEEK_DATA_VERSION);
                expect(CLDR_WEEK_DATA_VERSION).toBe("46");
            });
        });
    });

    describe("resolveExplicitFirstDayOverride", () => {
        it("parses explicit Unicode fw override", () => {
            expect(resolveExplicitFirstDayOverride("en-GB-u-fw-sun")).toBe("sunday");
            expect(resolveExplicitFirstDayOverride("en-US-u-fw-mon")).toBe("monday");
        });

        it("preserves legitimate Unicode override before private use", () => {
            expect(resolveExplicitFirstDayOverride("en-GB-u-fw-sun-x-anything")).toBe("sunday");
            expect(resolveExplicitFirstDayOverride("en-GB-u-fw-sun-x-test")).toBe("sunday");
            expect(resolveExplicitFirstDayOverride("en-US-u-fw-mon-x-test")).toBe("monday");
        });

        it("treats -x- private use as terminal and ignores opaque payload", () => {
            expect(resolveExplicitFirstDayOverride("en-GB-x-u-fw-sun")).toBeNull();
            expect(resolveExplicitFirstDayOverride("en-US-x-u-fw-mon")).toBeNull();
            expect(resolveExplicitFirstDayOverride("x-u-fw-sun")).toBeNull();
        });

        it("returns null for empty, invalid, or missing fw tags", () => {
            expect(resolveExplicitFirstDayOverride("")).toBeNull();
            expect(resolveExplicitFirstDayOverride("en-US")).toBeNull();
            expect(resolveExplicitFirstDayOverride("en-US-u-ca-gregory")).toBeNull();
            expect(resolveExplicitFirstDayOverride("en-US-u-fw-invalid")).toBeNull();
        });
    });

    describe("resolveLikelyFirstDayOfWeek", () => {
        it("resolves CLDR 46 likely week start for base languages", () => {
            expect(resolveLikelyFirstDayOfWeek("en")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("pt")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("he")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("hi")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("ja")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("ko")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("ar")).toBe("saturday");
            expect(resolveLikelyFirstDayOfWeek("fa")).toBe("saturday");
            expect(resolveLikelyFirstDayOfWeek("dv")).toBe("friday");
            expect(resolveLikelyFirstDayOfWeek("id")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("th")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("ur")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("bn")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("fil")).toBe("sunday");
        });

        it("resolves script-sensitive tags according to CLDR likely subtags", () => {
            expect(resolveLikelyFirstDayOfWeek("zh-Hant")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("en-Shaw")).toBe("monday");
            expect(resolveLikelyFirstDayOfWeek("pal-Phlp")).toBe("monday");
            expect(resolveLikelyFirstDayOfWeek("yue-Hans")).toBe("monday");
        });

        it("returns null for Monday default languages and unknown tags", () => {
            expect(resolveLikelyFirstDayOfWeek("de")).toBeNull();
            expect(resolveLikelyFirstDayOfWeek("fr")).toBeNull();
            expect(resolveLikelyFirstDayOfWeek("es")).toBeNull();
            expect(resolveLikelyFirstDayOfWeek("zh")).toBeNull();
            expect(resolveLikelyFirstDayOfWeek("zh-Hans")).toBeNull();
            expect(resolveLikelyFirstDayOfWeek("xyz-unknown")).toBeNull();
        });

        it("resolves undefined language (und) and und-Script tags according to CLDR 46 likely subtags", () => {
            expect(resolveLikelyFirstDayOfWeek("und")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("und-Latn")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("und-Hant")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("und-Hebr")).toBe("sunday");
            expect(resolveLikelyFirstDayOfWeek("und-Arab")).toBe("saturday");
            expect(resolveLikelyFirstDayOfWeek("und-Cyrl")).toBe("monday");
            expect(resolveLikelyFirstDayOfWeek("und-Diak")).toBe("friday");
        });
    });

    describe("roundtrip formatting and parsing", () => {
        const testDate = new Date(2026, 8, 15, 21, 30, 45);

        it("formats and parses Japanese date correctly", () => {
            const format = getLocaleDateInputFormat("ja-JP");
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("2026/09/15");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
        });

        it("formats and parses Japanese 12-hour time correctly with day period", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("午後09:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Japanese 12-hour datetime correctly", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("2026/09/15 午後09:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Brazilian Portuguese date correctly", () => {
            const format = getLocaleDateInputFormat("pt-BR");
            const dt = DateTime.fromJSDate(testDate).setLocale("pt-BR");
            const str = dt.toFormat(format);
            expect(str).toBe("15/09/2026");

            const parsed = DateTime.fromFormat(str, format, { locale: "pt-BR" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
        });

        it("formats and parses Brazilian Portuguese 24-hour time correctly", () => {
            const format = getLocaleTimeInputFormat("pt-BR", { hourFormat: "24", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("pt-BR");
            const str = dt.toFormat(format);
            expect(str).toBe("21:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "pt-BR" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Brazilian Portuguese 24-hour datetime correctly", () => {
            const format = getLocaleDateTimeInputFormat("pt-BR", { hourFormat: "24", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("pt-BR");
            const str = dt.toFormat(format);
            expect(str).toBe("15/09/2026, 21:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "pt-BR" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Simplified Chinese date, 12h time, and datetime correctly", () => {
            const dateFormat = getLocaleDateInputFormat("zh-CN");
            const dtCN = DateTime.fromJSDate(testDate).setLocale("zh-CN");
            expect(dtCN.toFormat(dateFormat)).toBe("2026/09/15");

            const timeFormat = getLocaleTimeInputFormat("zh-CN", { hourFormat: "12", showSeconds: false });
            expect(dtCN.toFormat(timeFormat)).toBe("下午09:30");

            const dtFormat = getLocaleDateTimeInputFormat("zh-CN", { hourFormat: "12", showSeconds: false });
            const str = dtCN.toFormat(dtFormat);
            expect(str).toBe("2026/09/15 下午09:30");

            const parsed = DateTime.fromFormat(str, dtFormat, { locale: "zh-CN" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Traditional Chinese date, 12h time, and datetime correctly", () => {
            const dateFormat = getLocaleDateInputFormat("zh-TW");
            const dtTW = DateTime.fromJSDate(testDate).setLocale("zh-TW");
            expect(dtTW.toFormat(dateFormat)).toBe("2026/09/15");

            const timeFormat = getLocaleTimeInputFormat("zh-TW", { hourFormat: "12", showSeconds: false });
            expect(dtTW.toFormat(timeFormat)).toBe("下午09:30");

            const dtFormat = getLocaleDateTimeInputFormat("zh-TW", { hourFormat: "12", showSeconds: false });
            const str = dtTW.toFormat(dtFormat);
            expect(str).toBe("2026/09/15 下午09:30");

            const parsed = DateTime.fromFormat(str, dtFormat, { locale: "zh-TW" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });
    });

    describe("whitespace normalization and portability", () => {
        it("ensures generated editable formats do not contain typographic whitespace (U+00A0, U+202F, U+2009)", () => {
            const locales = ["en-US", "de-DE", "fr-FR", "es-ES", "ja-JP", "pt-BR", "zh-CN", "zh-TW"];
            for (const loc of locales) {
                const time12 = getLocaleTimeInputFormat(loc, { hourFormat: "12" });
                expect(time12).not.toMatch(/[\u00A0\u2009\u202F]/);

                const time12Seconds = getLocaleTimeInputFormat(loc, { hourFormat: "12", showSeconds: true });
                expect(time12Seconds).not.toMatch(/[\u00A0\u2009\u202F]/);

                const time24 = getLocaleTimeInputFormat(loc, { hourFormat: "24" });
                expect(time24).not.toMatch(/[\u00A0\u2009\u202F]/);

                const dateTime12 = getLocaleDateTimeInputFormat(loc, { hourFormat: "12" });
                expect(dateTime12).not.toMatch(/[\u00A0\u2009\u202F]/);

                const date = getLocaleDateInputFormat(loc);
                expect(date).not.toMatch(/[\u00A0\u2009\u202F]/);
            }
        });


        it("preserves Japanese day period in prefix position", () => {
            const format12 = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12" });
            expect(format12.startsWith("a")).toBe(true);
            expect(format12).toBe("ahh:mm");

            const dtFormat12 = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "12" });
            expect(dtFormat12).toBe("yyyy/MM/dd ahh:mm");
        });

        it("preserves English day period in suffix position with ordinary ASCII space", () => {
            const format12 = getLocaleTimeInputFormat("en-US", { hourFormat: "12" });
            expect(format12).toBe("hh:mm a");
            expect(format12.includes("\u202F")).toBe(false);
            expect(format12.includes(" ")).toBe(true);

            const dtFormat12 = getLocaleDateTimeInputFormat("en-US", { hourFormat: "12" });
            expect(dtFormat12).toBe("MM/dd/yyyy, hh:mm a");
        });

        it("parses typed input with ordinary ASCII space using auto-generated formats", () => {
            const usFormat = getLocaleTimeInputFormat("en-US", { hourFormat: "12" });
            const parsedUs = DateTime.fromFormat("09:30 PM", usFormat, { locale: "en-US" });
            expect(parsedUs.isValid).toBe(true);
            expect(parsedUs.hour).toBe(21);
            expect(parsedUs.minute).toBe(30);

            const jaFormat = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12" });
            const parsedJa = DateTime.fromFormat("午後09:30", jaFormat, { locale: "ja-JP" });
            expect(parsedJa.isValid).toBe(true);
            expect(parsedJa.hour).toBe(21);
            expect(parsedJa.minute).toBe(30);
        });

        it("tolerates space character differences between typed input and parse format in parseGregorianDate", () => {
            // Normal space in input, narrow NBSP in format
            const dt1 = parseGregorianDate("09:30 PM", "hh:mm\u202fa", "en-US");
            expect(dt1.isValid).toBe(true);
            expect(dt1.hour).toBe(21);
            expect(dt1.minute).toBe(30);

            // Narrow NBSP in input, normal space in format
            const dt2 = parseGregorianDate("09:30\u202fPM", "hh:mm a", "en-US");
            expect(dt2.isValid).toBe(true);
            expect(dt2.hour).toBe(21);
            expect(dt2.minute).toBe(30);

            // NBSP in input, normal space in format
            const dt3 = parseGregorianDate("09:30\u00a0PM", "hh:mm a", "en-US");
            expect(dt3.isValid).toBe(true);
            expect(dt3.hour).toBe(21);
            expect(dt3.minute).toBe(30);

            // Date and time with space normalization
            const dt4 = parseGregorianDate("09/15/2026, 09:30 PM", "MM/dd/yyyy, hh:mm a", "en-US");
            expect(dt4.isValid).toBe(true);
            expect(dt4.year).toBe(2026);
            expect(dt4.month).toBe(9);
            expect(dt4.day).toBe(15);
        });
    });
});


