import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
    auditAllLocales,
    auditLocaleMessagesFile,
    auditLocaleMetadataFile,
    canonicalizeLocaleId,
    checkSchemaDrift,
    discoverOfficialLocales,
    isAllowedLocaleCopyException,
    isAllowedTechnicalToken,
    loadCanonicalMessageNamespaces,
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
        });

        it("disallows general English words and language-specific words", () => {
            expect(isAllowedTechnicalToken("First page")).toBe(false);
            expect(isAllowedTechnicalToken("Delete row")).toBe(false);
            expect(isAllowedTechnicalToken("Save")).toBe(false);
            expect(isAllowedTechnicalToken("Cancel")).toBe(false);
            expect(isAllowedTechnicalToken("Today")).toBe(false);
            expect(isAllowedTechnicalToken("Color")).toBe(false);
            expect(isAllowedTechnicalToken("Error")).toBe(false);
            expect(isAllowedTechnicalToken("C")).toBe(false);
        });
    });

    describe("isAllowedLocaleCopyException", () => {
        it("allows Spanish-specific unchanged words on approved paths", () => {
            expect(isAllowedLocaleCopyException("es-ES", "editor.color", "Color")).toBe(true);
            expect(isAllowedLocaleCopyException("es-ES", "notification.error", "Error")).toBe(true);
            expect(isAllowedLocaleCopyException("es-ES", "chart.closeAbbreviation", "C")).toBe(true);
            expect(isAllowedLocaleCopyException("es-ES", "colorPalette.color", "Color")).toBe(true);
        });

        it("disallows Spanish-specific exceptions for other locales or unapproved paths", () => {
            expect(isAllowedLocaleCopyException("de-DE", "editor.color", "Color")).toBe(false);
            expect(isAllowedLocaleCopyException("de-DE", "notification.error", "Error")).toBe(false);
            expect(isAllowedLocaleCopyException("es-ES", "other.error", "Error")).toBe(false);
            expect(isAllowedLocaleCopyException(undefined, "editor.color", "Color")).toBe(false);
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
                detail: expect.stringContaining('firstPageLabel": "First page"')
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

        it("rejects file where satisfies MonaLocaleMessages is only on an unrelated decoy", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                declare const decoyCatalog: MonaLocaleMessages;
                const dummy = decoyCatalog satisfies MonaLocaleMessages;
                export const ES_ES_MESSAGES = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                };
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "completeness-bypass" && v.detail.includes("satisfies MonaLocaleMessages"))).toBe(true);
        });

        it("detects copied English across namespaces without leaf name collision overwriting", () => {
            const englishDefaults = new Map<string, any>([
                ["autoComplete.clear", { namespace: "autoComplete", key: "clear", kind: "static", staticFragments: ["Clear"] }],
                ["comboBox.clear", { namespace: "comboBox", key: "clear", kind: "static", staticFragments: ["Clear combo"] }]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    autoComplete: {
                        clear: "Clear"
                    },
                    comboBox: {
                        clear: "Limpiar"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults);
            expect(violations.some(v => v.category === "copied-english" && v.detail.includes("autoComplete.clear"))).toBe(true);
        });

        it("detects copied English in function-valued template messages", () => {
            const englishDefaults = new Map<string, any>([
                ["pager.pageLabel", {
                    namespace: "pager",
                    key: "pageLabel",
                    kind: "function",
                    staticFragments: ["Page "]
                }]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    pager: {
                        pageLabel: (page: number) => \`Page \${page}\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults);
            expect(violations.some(v => v.category === "copied-english" && v.detail.includes("pageLabel"))).toBe(true);
        });

        it("rejects file with 'any' type annotation on official messages catalog", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES: any = {
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "forbidden-syntax" && v.detail.includes(": any"))).toBe(true);
        });

        it("rejects file with 'as never' type-erasure bypass", () => {
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = ({
                    pager: {
                        firstPageLabel: "Primera página"
                    }
                } as never) satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code);
            expect(violations.some(v => v.category === "forbidden-syntax" && v.detail.includes("never"))).toBe(true);
        });

        it("accepts legitimately translated function-valued messages", () => {
            const englishDefaults = new Map<string, any>([
                ["pager.pageLabel", {
                    namespace: "pager",
                    key: "pageLabel",
                    kind: "function",
                    staticFragments: ["Page "]
                }]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const TEST_MESSAGES = {
                    pager: {
                        pageLabel: (page: number) => \`Página \${page}\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults);
            expect(violations).toHaveLength(0);
        });

        it("detects partially untranslated singular branch copied from English in function message", () => {
            const englishDefaults = new Map<string, any>([
                ["pager.resultsAvailable", {
                    namespace: "pager",
                    key: "resultsAvailable",
                    kind: "function",
                    staticFragments: ["1 result available", "results available"]
                }]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    pager: {
                        resultsAvailable: (count: number) =>
                            count === 1 ? "1 result available" : \`\${count} resultados disponibles\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults, "es-ES");
            expect(violations.some(v => v.category === "copied-english" && v.detail.includes("resultsAvailable"))).toBe(true);
        });

        it("detects partially untranslated plural branch copied from English in function message", () => {
            const englishDefaults = new Map<string, any>([
                ["pager.resultsAvailable", {
                    namespace: "pager",
                    key: "resultsAvailable",
                    kind: "function",
                    staticFragments: ["1 result available", "results available"]
                }]
            ]);
            const code = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    pager: {
                        resultsAvailable: (count: number) =>
                            count === 1 ? "1 resultado disponible" : \`\${count} results available\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const violations = auditLocaleMessagesFile("test.messages.ts", code, englishDefaults, "es-ES");
            expect(violations.some(v => v.category === "copied-english" && v.detail.includes("resultsAvailable"))).toBe(true);
        });

        it("allows Spanish-specific unchanged words with scoped exception but rejects for other locales", () => {
            const englishDefaults = new Map<string, any>([
                ["notification.error", {
                    namespace: "notification",
                    key: "error",
                    kind: "static",
                    staticFragments: ["Error"]
                }],
                ["editor.color", {
                    namespace: "editor",
                    key: "color",
                    kind: "static",
                    staticFragments: ["Color"]
                }],
                ["chart.closeAbbreviation", {
                    namespace: "chart",
                    key: "closeAbbreviation",
                    kind: "static",
                    staticFragments: ["C"]
                }]
            ]);
            const esCode = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    notification: { error: "Error" },
                    editor: { color: "Color" },
                    chart: { closeAbbreviation: "C" }
                } satisfies MonaLocaleMessages;
            `;
            const esViolations = auditLocaleMessagesFile("es-es.messages.ts", esCode, englishDefaults, "es-ES");
            expect(esViolations.filter(v => v.category === "copied-english")).toHaveLength(0);

            const deCode = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const DE_DE_MESSAGES = {
                    notification: { error: "Error" },
                    editor: { color: "Color" },
                    chart: { closeAbbreviation: "C" }
                } satisfies MonaLocaleMessages;
            `;
            const deViolations = auditLocaleMessagesFile("de-de.messages.ts", deCode, englishDefaults, "de-DE");
            expect(deViolations.filter(v => v.category === "copied-english")).toHaveLength(3);
        });

        it("allows approved function-fragment exception for Spanish colorPalette.color", () => {
            const englishDefaults = new Map<string, any>([
                ["colorPalette.color", {
                    namespace: "colorPalette",
                    key: "color",
                    kind: "function",
                    staticFragments: ["Color "]
                }]
            ]);
            const esCode = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const ES_ES_MESSAGES = {
                    colorPalette: {
                        color: (color: string) => \`Color \${color}\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const esViolations = auditLocaleMessagesFile("es-es.messages.ts", esCode, englishDefaults, "es-ES");
            expect(esViolations.filter(v => v.category === "copied-english")).toHaveLength(0);

            const deCode = `
                import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                export const DE_DE_MESSAGES = {
                    colorPalette: {
                        color: (color: string) => \`Color \${color}\`
                    }
                } satisfies MonaLocaleMessages;
            `;
            const deViolations = auditLocaleMessagesFile("de-de.messages.ts", deCode, englishDefaults, "de-DE");
            expect(deViolations.some(v => v.category === "copied-english" && v.detail.includes("colorPalette.color"))).toBe(true);
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

        it("rejects file where valid metadata is on an unexported decoy and exported locale is partial or missing satisfies", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./es-es.messages";

                const decoyLocale = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                };

                export const MONA_ES_ES_LOCALE = {
                    id: "es-ES"
                };
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code);
            expect(violations.length).toBeGreaterThan(0);
        });

        it("rejects locale metadata referencing wrong sibling messages constant", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { OTHER_MESSAGES } from "./other.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: OTHER_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code, "es-ES", "ES_ES_MESSAGES");
            expect(violations.some(v => v.category === "invalid-metadata" && v.detail.includes("ES_ES_MESSAGES"))).toBe(true);
        });

        it("rejects multiple official locale exports in a single metadata file", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./es-es.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;

                export const MONA_SECOND_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code);
            expect(violations.some(v => v.category === "invalid-metadata" && v.detail.includes("exactly one"))).toBe(true);
        });

        it("rejects wrong locale aliased under the expected messages identifier", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { DE_DE_MESSAGES as ES_ES_MESSAGES } from "../de-de/de-de.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code, "es-ES", "ES_ES_MESSAGES");
            expect(
                violations.some(
                    v => v.category === "invalid-metadata" && v.detail.includes("alias")
                )
            ).toBe(true);
        });

        it("rejects correct symbol imported from wrong or non-sibling module", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "../legacy/es-es.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code, "es-ES", "ES_ES_MESSAGES");
            expect(
                violations.some(
                    v => v.category === "invalid-metadata" && v.detail.includes("direct sibling")
                )
            ).toBe(true);
        });

        it("rejects messages identifier defined via local shadow variable instead of imported sibling", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                const ES_ES_MESSAGES = {} as any;

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile("test.locale.ts", code, "es-ES", "ES_ES_MESSAGES");
            expect(
                violations.some(
                    v => v.category === "invalid-metadata" && v.detail.includes("shadowed")
                )
            ).toBe(true);
        });

        it("rejects messages import that does not resolve to expected sibling messages file", () => {
            const code = `
                import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                import { ES_ES_MESSAGES } from "./de-de.messages";

                export const MONA_ES_ES_LOCALE = {
                    direction: "ltr",
                    id: "es-ES",
                    messages: ES_ES_MESSAGES
                } satisfies MonaLocale;
            `;
            const violations = auditLocaleMetadataFile(
                "/repo/locales/es-es/es-es.locale.ts",
                code,
                "es-ES",
                "ES_ES_MESSAGES",
                "/repo/locales/es-es/es-es.messages.ts"
            );
            expect(
                violations.some(
                    v => v.category === "invalid-metadata" && v.detail.includes("does not resolve to expected")
                )
            ).toBe(true);
        });
    });

    describe("canonicalizeLocaleId", () => {
        it("handles valid canonical and extended BCP-47 tags and rejects malformed tags", () => {
            expect(canonicalizeLocaleId("es-ES")).toBe("es-ES");
            expect(canonicalizeLocaleId("de-DE")).toBe("de-DE");
            expect(canonicalizeLocaleId("zh-Hant-TW")).toBe("zh-Hant-TW");
            expect(canonicalizeLocaleId("en-US-u-ca-gregory")).toBe("en-US-u-ca-gregory");
            expect(canonicalizeLocaleId("definitely_not_a_locale")).toBeNull();
        });
    });

    describe("auditAllLocales", () => {
        it("fails closed when locale directory does not exist", () => {
            const violations = auditAllLocales("/non/existent/locale/path");
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.detail.includes("does not exist"))).toBe(true);
        });

        it("rejects locale folder missing *.locale.ts or *.messages.ts", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-locale-missing-"));
            try {
                const esFolder = join(tempDir, "es-es");
                mkdirSync(esFolder, { recursive: true });
                writeFileSync(join(tempDir, "public-api.ts"), `export { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";\n`);
                writeFileSync(join(esFolder, "es-es.messages.ts"), `
                    import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                    export const ES_ES_MESSAGES = {} satisfies MonaLocaleMessages;
                `);
                const violations = auditAllLocales(tempDir);
                expect(violations.some(v => v.detail.includes("Missing *.locale.ts"))).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("rejects duplicate locale IDs across folders", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-locale-dup-"));
            try {
                const esFolder1 = join(tempDir, "es-es");
                const esFolder2 = join(tempDir, "es_ES");
                mkdirSync(esFolder1, { recursive: true });
                mkdirSync(esFolder2, { recursive: true });
                writeFileSync(
                    join(tempDir, "public-api.ts"),
                    `export { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";\nexport { MONA_ES_ES_ALT_LOCALE } from "./es_ES/es_ES.locale";\n`
                );
                writeFileSync(
                    join(esFolder1, "es-es.messages.ts"),
                    `import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const ES_ES_MESSAGES = {} satisfies MonaLocaleMessages;\n`
                );
                writeFileSync(
                    join(esFolder1, "es-es.locale.ts"),
                    `import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";\nimport { ES_ES_MESSAGES } from "./es-es.messages";\nexport const MONA_ES_ES_LOCALE = { direction: "ltr", id: "es-ES", messages: ES_ES_MESSAGES } satisfies MonaLocale;\n`
                );
                writeFileSync(
                    join(esFolder2, "es_ES.messages.ts"),
                    `import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const ES_ES_ALT_MESSAGES = {} satisfies MonaLocaleMessages;\n`
                );
                writeFileSync(
                    join(esFolder2, "es_ES.locale.ts"),
                    `import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";\nimport { ES_ES_ALT_MESSAGES } from "./es_ES.messages";\nexport const MONA_ES_ES_ALT_LOCALE = { direction: "ltr", id: "es-ES", messages: ES_ES_ALT_MESSAGES } satisfies MonaLocale;\n`
                );
                const violations = auditAllLocales(tempDir);
                expect(
                    violations.some(
                        v =>
                            v.category === "invalid-metadata" &&
                            v.detail.includes('Duplicate locale ID "es-ES"')
                    )
                ).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("rejects folder name and locale ID mismatch", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-locale-test-"));
            try {
                const deFolder = join(tempDir, "de-de");
                mkdirSync(deFolder, { recursive: true });
                writeFileSync(join(tempDir, "public-api.ts"), `export { MONA_ES_ES_LOCALE } from "./de-de/de-de.locale";\n`);
                writeFileSync(join(deFolder, "de-de.messages.ts"), `
                    import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                    export const DE_DE_MESSAGES = {} satisfies MonaLocaleMessages;
                `);
                writeFileSync(join(deFolder, "de-de.locale.ts"), `
                    import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                    import { DE_DE_MESSAGES } from "./de-de.messages";
                    export const MONA_ES_ES_LOCALE = {
                        direction: "ltr",
                        id: "es-ES",
                        messages: DE_DE_MESSAGES
                    } satisfies MonaLocale;
                `);
                const violations = auditAllLocales(tempDir);
                expect(violations.some(v => v.detail.includes("mismatch") || v.detail.includes("does not match") || v.detail.includes("canonical"))).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("rejects official locale missing from public-api.ts", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-locale-test-"));
            try {
                const esFolder = join(tempDir, "es-es");
                mkdirSync(esFolder, { recursive: true });
                writeFileSync(join(tempDir, "public-api.ts"), `// empty\n`);
                writeFileSync(join(esFolder, "es-es.messages.ts"), `
                    import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
                    export const ES_ES_MESSAGES = {} satisfies MonaLocaleMessages;
                `);
                writeFileSync(join(esFolder, "es-es.locale.ts"), `
                    import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";
                    import { ES_ES_MESSAGES } from "./es-es.messages";
                    export const MONA_ES_ES_LOCALE = {
                        direction: "ltr",
                        id: "es-ES",
                        messages: ES_ES_MESSAGES
                    } satisfies MonaLocale;
                `);
                const violations = auditAllLocales(tempDir);
                expect(violations.some(v => v.detail.includes("public-api.ts") || v.detail.includes("not exported"))).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it("discovers multiple official locales in a synthetic repository without violations", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-locales-multi-"));
            try {
                const esFolder = join(tempDir, "es-es");
                const deFolder = join(tempDir, "de-de");
                mkdirSync(esFolder, { recursive: true });
                mkdirSync(deFolder, { recursive: true });
                writeFileSync(
                    join(tempDir, "public-api.ts"),
                    `export { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";\nexport { MONA_DE_DE_LOCALE } from "./de-de/de-de.locale";\n`
                );
                writeFileSync(
                    join(esFolder, "es-es.messages.ts"),
                    `import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const ES_ES_MESSAGES = {} satisfies MonaLocaleMessages;\n`
                );
                writeFileSync(
                    join(esFolder, "es-es.locale.ts"),
                    `import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";\nimport { ES_ES_MESSAGES } from "./es-es.messages";\nexport const MONA_ES_ES_LOCALE = { direction: "ltr", id: "es-ES", messages: ES_ES_MESSAGES } satisfies MonaLocale;\n`
                );
                writeFileSync(
                    join(deFolder, "de-de.messages.ts"),
                    `import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const DE_DE_MESSAGES = {} satisfies MonaLocaleMessages;\n`
                );
                writeFileSync(
                    join(deFolder, "de-de.locale.ts"),
                    `import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";\nimport { DE_DE_MESSAGES } from "./de-de.messages";\nexport const MONA_DE_DE_LOCALE = { direction: "ltr", id: "de-DE", messages: DE_DE_MESSAGES } satisfies MonaLocale;\n`
                );

                const discovery = discoverOfficialLocales(tempDir);
                expect(discovery.violations).toHaveLength(0);
                expect(discovery.locales).toHaveLength(2);
                for (const locale of discovery.locales) {
                    expect(locale.localeExport).toMatch(/^MONA_[A-Z0-9_]+_LOCALE$/);
                    expect(locale.messagesExport).toMatch(/^[A-Z0-9_]+_MESSAGES$/);
                    expect(locale.canonicalId.length).toBeGreaterThan(0);
                }
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });

    describe("loadDefaultEnglishStrings and Schema Parity", () => {
        it("fails closed when English defaults base directory does not exist", () => {
            const result = loadDefaultEnglishStrings("/non/existent/base/dir");
            expect(result.violations.some(v => v.detail.includes("English default message root does not exist"))).toBe(true);
        });

        it("fails when English base directory contains zero default message catalogs", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-no-defaults-"));
            try {
                const result = loadDefaultEnglishStrings(tempDir);
                expect(result.violations.some(v => v.detail.includes("Zero default English message catalogs"))).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when a default-message file has an unknown or unmapped namespace", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-unknown-ns-"));
            try {
                const unknownDir = join(tempDir, "unknown-widget");
                mkdirSync(unknownDir, { recursive: true });
                writeFileSync(
                    join(unknownDir, "unknown-widget.default-messages.ts"),
                    `export const UNKNOWN_MESSAGES = { foo: "bar" };\n`
                );
                const result = loadDefaultEnglishStrings(tempDir);
                expect(result.violations.some(v => v.detail.includes("unknown or unmapped namespace"))).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when duplicate fingerprints exist for the same namespace.key path", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "mona-dup-fp-"));
            try {
                const dir1 = join(tempDir, "pager-a");
                const dir2 = join(tempDir, "pager-b");
                mkdirSync(dir1, { recursive: true });
                mkdirSync(dir2, { recursive: true });
                writeFileSync(
                    join(dir1, "pager.default-messages.ts"),
                    `import type { MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";
export const PAGER_A_DEFAULT_MESSAGES: MonaPagerMessages = {
    firstPageLabel: "First page"
} as any;\n`
                );
                writeFileSync(
                    join(dir2, "pager.default-messages.ts"),
                    `import type { MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";
export const PAGER_B_DEFAULT_MESSAGES: MonaPagerMessages = {
    firstPageLabel: "First page duplicate"
} as any;\n`
                );
                const result = loadDefaultEnglishStrings(tempDir);
                expect(
                    result.violations.some(
                        v => v.detail.includes("Duplicate English default message fingerprint") && v.detail.includes("pager.firstPageLabel")
                    )
                ).toBe(true);
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("detects drift when canonical schema has namespaces missing from MONA_MESSAGE_NAMESPACES", () => {
            const canonicalNamespaces = new Set(["autoComplete", "newWidgetNamespace"]);
            const violations = checkSchemaDrift(canonicalNamespaces, "test-schema.ts");
            expect(violations.some(v => v.detail.includes("drifted") && v.detail.includes("newWidgetNamespace"))).toBe(true);
        });

        it("detects drift when MONA_MESSAGE_NAMESPACES has extra namespaces missing from canonical schema", () => {
            const canonicalNamespaces = new Set(["autoComplete"]);
            const violations = checkSchemaDrift(canonicalNamespaces, "test-schema.ts");
            expect(violations.some(v => v.detail.includes("drifted") && v.detail.includes("extra"))).toBe(true);
        });
    });

    describe("Real Repository Locale Integration", () => {
        it("verifies exact parity between MonaLocaleMessages interface and MONA_MESSAGE_NAMESPACES", () => {
            const canonical = loadCanonicalMessageNamespaces();
            expect(canonical.violations).toHaveLength(0);
            expect(canonical.namespaces.size).toBe(40);
            const drift = checkSchemaDrift(canonical.namespaces, "canonical-schema");
            expect(drift).toHaveLength(0);
        });

        it("discovers all 40 canonical namespaces in the real repository English defaults", () => {
            const defaults = loadDefaultEnglishStrings();
            expect(defaults.violations).toHaveLength(0);
            const canonical = loadCanonicalMessageNamespaces();
            for (const ns of canonical.namespaces) {
                expect(defaults.namespaces.has(ns)).toBe(true);
            }
        });

        it("discovers non-empty, representative English defaults matching canonical namespaces", () => {
            const defaults = loadDefaultEnglishStrings();
            expect(defaults.size).toBeGreaterThan(50);
            expect(defaults.has("pager.firstPageLabel")).toBe(true);
            expect(defaults.has("grid.deleteRowConfirmation")).toBe(true);
            expect(defaults.has("calendar.today")).toBe(true);
            expect(defaults.has("splitButton.splitButton")).toBe(true);

            // Verify function messages are fingerprinted with kind === 'function'
            const pageLabel = defaults.get("pager.pageLabel");
            expect(pageLabel?.kind).toBe("function");
            expect(pageLabel?.staticFragments.length).toBeGreaterThan(0);
        });

        it("runs auditAllLocales against the repository without violations", () => {
            const violations = auditAllLocales();
            expect(violations).toHaveLength(0);
        });

        it("discovers all official locales without structural violations", () => {
            const discovery = discoverOfficialLocales();
            expect(discovery.locales.length).toBeGreaterThan(0);
            expect(discovery.violations).toHaveLength(0);
            for (const locale of discovery.locales) {
                expect(locale.localeExport).toMatch(/^MONA_[A-Z0-9_]+_LOCALE$/);
                expect(locale.messagesExport).toMatch(/^[A-Z0-9_]+_MESSAGES$/);
                expect(locale.canonicalId.length).toBeGreaterThan(0);
            }
        });

        it("discovers the official Spanish locale", () => {
            const discovery = discoverOfficialLocales();
            expect(
                discovery.locales.some(
                    locale =>
                        locale.canonicalId === "es-ES" &&
                        locale.localeExport === "MONA_ES_ES_LOCALE" &&
                        locale.messagesExport === "ES_ES_MESSAGES"
                )
            ).toBe(true);
        });
    });
});
