import { describe, expect, it } from "vitest";
import {
    auditLocaleMessagesFile,
    auditLocaleMetadataFile,
    isAllowedTechnicalToken,
    loadDefaultEnglishStrings
} from "./audit-locales";

describe("audit-locales", () => {
    describe("isAllowedTechnicalToken", () => {
        it("allows legitimate technical tokens", () => {
            expect(isAllowedTechnicalToken("HEX")).toBe(true);
            expect(isAllowedTechnicalToken("RGB")).toBe(true);
            expect(isAllowedTechnicalToken("URL")).toBe(true);
            expect(isAllowedTechnicalToken("HTML")).toBe(true);
            expect(isAllowedTechnicalToken("AM")).toBe(true);
            expect(isAllowedTechnicalToken("PM")).toBe(true);
            expect(isAllowedTechnicalToken("px")).toBe(true);
            expect(isAllowedTechnicalToken(":")).toBe(true);
            expect(isAllowedTechnicalToken("Color")).toBe(true);
            expect(isAllowedTechnicalToken("Error")).toBe(true);
        });

        it("disallows general English words", () => {
            expect(isAllowedTechnicalToken("First page")).toBe(false);
            expect(isAllowedTechnicalToken("Delete row")).toBe(false);
            expect(isAllowedTechnicalToken("Save")).toBe(false);
            expect(isAllowedTechnicalToken("Cancel")).toBe(false);
            expect(isAllowedTechnicalToken("Today")).toBe(false);
        });
    });

    describe("auditLocaleMessagesFile", () => {
        it("accepts valid official message catalog with satisfies MonaLocaleMessages", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations).toHaveLength(0);
        });

        it("detects missing 'satisfies MonaLocaleMessages'", () => {
            const code = `
                export const TEST_MESSAGES = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                };
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "completeness-bypass" && v.detail.includes("satisfies MonaLocaleMessages"))).toBe(true);
        });

        it("detects forbidden 'as any' assertion", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = ({
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } as any) satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "forbidden-syntax" && v.detail.includes("as any"))).toBe(true);
        });

        it("detects forbidden 'as MonaLocaleMessages' completeness bypass", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } as MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "completeness-bypass" && v.detail.includes("as MonaLocaleMessages"))).toBe(true);
        });

        it("detects forbidden DeepPartial usage for official catalog", () => {
            const code = `
                import type { MonaLocaleMessages, DeepPartial } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } as DeepPartial<MonaLocaleMessages>;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "completeness-bypass" && v.detail.includes("DeepPartial"))).toBe(true);
        });

        it("detects forbidden spread assignment from default catalogs", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                import { PAGER_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/pager";
                export const TEST_MESSAGES = {
                    pager: {
                        ...PAGER_DEFAULT_MESSAGES,
                        firstPageLabel: "Primera página"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "completeness-bypass" && v.detail.includes("spread assignment"))).toBe(true);
        });

        it("detects accidental copied English default strings", () => {
            const englishDefaults = new Map<string, string>([
                ["firstPageLabel", "First page"],
                ["lastPageLabel", "Last page"]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    pager: {
                        firstPageLabel: "First page",
                        lastPageLabel: "Última página"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults);
            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "copied-english",
                detail: expect.stringContaining('Accidental copied English default string for "firstPageLabel": "First page"')
            });
        });

        it("does not report false positives for technical tokens like HEX or AM", () => {
            const englishDefaults = new Map<string, string>([
                ["am", "AM"],
                ["hex", "HEX"]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    timeSelector: {
                        am: "AM"
                    },
                    colorGradient: {
                        hex: "HEX"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults);
            expect(violations).toHaveLength(0);
        });
    });

    describe("auditLocaleMetadataFile", () => {
        it("accepts valid locale metadata object", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./es-es.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code);
            expect(violations).toHaveLength(0);
        });

        it("rejects invalid locale direction", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./es-es.messages";

                export const MONA_TEST_LOCALE = {
                    direction: "horizontal",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code);
            expect(violations.some(v => v.category === "invalid-metadata" && v.detail.includes('must be "ltr" or "rtl"'))).toBe(true);
        });

        it("rejects invalid BCP 47 locale tag", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./es-es.messages";

                export const MONA_TEST_LOCALE = {
                    direction: "ltr",
                    id: "spanish_spain_invalid!",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code);
            expect(violations.some(v => v.category === "invalid-metadata" && v.detail.includes("BCP 47"))).toBe(true);
        });
    });
});
