/* eslint-disable @typescript-eslint/naming-convention */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
    resolveExportTargets,
    resolveTypeScriptCompilerPath,
    runConsumerSmokeTest,
    verifyBuiltPackage,
    verifyThirdPartyNotices
} from "./verify-built-package";

describe("verify-built-package", () => {
    describe("resolveExportTargets", () => {
        it("throws when package.json does not exist", () => {
            expect(() => resolveExportTargets("/non/existent/package.json")).toThrow("not found");
        });

        it("throws when exports field is missing", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(pkgPath, JSON.stringify({ name: "test-pkg" }));
                expect(() => resolveExportTargets(pkgPath)).toThrow('no "exports" field');
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("throws when exports['./locales'] is missing", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(pkgPath, JSON.stringify({ name: "test-pkg", exports: { ".": "./index.js" } }));
                expect(() => resolveExportTargets(pkgPath)).toThrow('missing exports["./locales"]');
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("throws when runtime target is missing", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./types/locales.d.ts"
                            }
                        }
                    })
                );
                expect(() => resolveExportTargets(pkgPath)).toThrow('missing an "import" or "default" runtime target');
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("throws when types target is missing", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                expect(() => resolveExportTargets(pkgPath)).toThrow('missing a "types" declaration path');
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("resolves valid export targets with default and types", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./types/nanahoshi-mona-ui-locales.d.ts",
                                default: "./fesm2022/nanahoshi-mona-ui-locales.mjs"
                            }
                        }
                    })
                );
                const targets = resolveExportTargets(pkgPath);
                expect(targets).toEqual({
                    runtimeRelPath: "./fesm2022/nanahoshi-mona-ui-locales.mjs",
                    typesRelPath: "./types/nanahoshi-mona-ui-locales.d.ts"
                });
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("resolves valid export targets prioritizing import over default", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./types/locales.d.ts",
                                import: "./esm/locales.mjs",
                                default: "./fesm2022/locales.mjs"
                            }
                        }
                    })
                );
                const targets = resolveExportTargets(pkgPath);
                expect(targets.runtimeRelPath).toBe("./esm/locales.mjs");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("resolves valid export targets for custom subpath like ./i18n", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./i18n": {
                                types: "./types/i18n.d.ts",
                                default: "./fesm2022/i18n.mjs"
                            }
                        }
                    })
                );
                const targets = resolveExportTargets(pkgPath, "./i18n");
                expect(targets).toEqual({
                    runtimeRelPath: "./fesm2022/i18n.mjs",
                    typesRelPath: "./types/i18n.d.ts"
                });
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });

    describe("resolveTypeScriptCompilerPath", () => {
        it("returns pinned tsc path when found in repoRoot", () => {
            const tscPath = resolveTypeScriptCompilerPath(process.cwd());
            expect(tscPath).toContain("typescript");
            expect(tscPath).toContain("tsc");
        });

        it("throws when pinned tsc is not found in repoRoot", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "tsc-resolve-test-"));
            try {
                expect(() => resolveTypeScriptCompilerPath(tempDir)).toThrow("Pinned TypeScript compiler not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });

    const DEFAULT_MOCK_I18N_MJS = `
export function getLocaleDateInputFormat(locale) { return "yyyy/MM/dd"; }
export function getLocaleTimeInputFormat(locale, options) { return "ahh:mm"; }
export function getLocaleDateTimeInputFormat(locale, options) { return "yyyy/MM/dd HH:mm"; }
export function getLocaleFirstDayOfWeek(locale) { return "sunday"; }
`;

    const DEFAULT_MOCK_I18N_DTS = `
export type LocaleFirstDayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export declare function getLocaleDateInputFormat(locale: string): string;
export declare function getLocaleTimeInputFormat(locale: string, options?: { hourFormat?: "12" | "24"; showSeconds?: boolean }): string;
export declare function getLocaleDateTimeInputFormat(locale: string, options?: { hourFormat?: "12" | "24"; showSeconds?: boolean }): string;
export declare function getLocaleFirstDayOfWeek(locale: string): LocaleFirstDayOfWeek;
`;

    const CANONICAL_CLDR_LICENSE = readFileSync(
        resolve(process.cwd(), "scripts/cldr/LICENSE"),
        "utf-8"
    );

    const DEFAULT_THIRD_PARTY_NOTICES = `# Third-Party Notices

## Unicode CLDR (Common Locale Data Repository)

### Unicode License v3

\`\`\`
${CANONICAL_CLDR_LICENSE.trim()}
\`\`\`
`;

    function populateFakeDist(
        dir: string,
        options: {
            localesMjs?: string;
            localesDts?: string;
            i18nMjs?: string;
            i18nDts?: string;
            exports?: Record<string, unknown>;
            thirdPartyNotices?: string | null;
        } = {}
    ): void {
        const pkgExports = options.exports ?? {
            "./locales": {
                types: "./locales.d.ts",
                default: "./locales.mjs"
            },
            "./i18n": {
                types: "./i18n.d.ts",
                default: "./i18n.mjs"
            }
        };
        writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@nanahoshi/mona-ui", exports: pkgExports }));
        if (options.localesMjs !== undefined) {
            writeFileSync(join(dir, "locales.mjs"), options.localesMjs);
        }
        if (options.localesDts !== undefined) {
            writeFileSync(join(dir, "locales.d.ts"), options.localesDts);
        }
        if (options.i18nMjs !== undefined) {
            writeFileSync(join(dir, "i18n.mjs"), options.i18nMjs);
        } else if (pkgExports["./i18n"]) {
            writeFileSync(join(dir, "i18n.mjs"), DEFAULT_MOCK_I18N_MJS);
        }
        if (options.i18nDts !== undefined) {
            writeFileSync(join(dir, "i18n.d.ts"), options.i18nDts);
        } else if (pkgExports["./i18n"]) {
            writeFileSync(join(dir, "i18n.d.ts"), DEFAULT_MOCK_I18N_DTS);
        }
        if (options.thirdPartyNotices !== undefined) {
            if (options.thirdPartyNotices !== null) {
                writeFileSync(join(dir, "THIRD_PARTY_NOTICES.md"), options.thirdPartyNotices);
            }
        } else {
            writeFileSync(join(dir, "THIRD_PARTY_NOTICES.md"), DEFAULT_THIRD_PARTY_NOTICES);
        }
    }

    describe("runConsumerSmokeTest", () => {
        it("succeeds when synthetic package exports expected locale matching runtime and types", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "ltr", messages: { greeting: "hola" } };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES", direction: "ltr" }]
                    })
                ).not.toThrow();
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("succeeds when synthetic package exports ko-KR with matching formatting and Sunday first-day", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    i18nMjs: `
export function getLocaleDateInputFormat(locale) { return "yyyy. MM. dd."; }
export function getLocaleTimeInputFormat(locale, options) { return "a hh:mm"; }
export function getLocaleDateTimeInputFormat(locale, options) { return "yyyy. MM. dd. a hh:mm"; }
export function getLocaleFirstDayOfWeek(locale) { return "sunday"; }
`,
                    localesDts: 'export declare const ko_KR: { id: string; direction: string; messages: Record<string, unknown> };\n',
                    localesMjs: 'export const ko_KR = { id: "ko-KR", direction: "ltr", messages: {} };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ direction: "ltr", id: "ko-KR", symbol: "ko_KR" }]
                    })
                ).not.toThrow();
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when ko-KR is expected but getLocaleDateInputFormat returns invalid format", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    i18nMjs: `
export function getLocaleDateInputFormat(locale) { return locale === "ko-KR" ? "yyyy/MM/dd" : "yyyy. MM. dd."; }
export function getLocaleTimeInputFormat() { return "a hh:mm"; }
export function getLocaleDateTimeInputFormat() { return "yyyy. MM. dd. a hh:mm"; }
export function getLocaleFirstDayOfWeek() { return "sunday"; }
`,
                    localesDts: 'export declare const ko_KR: { id: string; direction: string; messages: Record<string, unknown> };\n',
                    localesMjs: 'export const ko_KR = { id: "ko-KR", direction: "ltr", messages: {} };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ direction: "ltr", id: "ko-KR", symbol: "ko_KR" }]
                    })
                ).toThrow("Invalid getLocaleDateInputFormat output for ko-KR: yyyy/MM/dd");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime package is missing expected export", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: "export const de_DE = { id: 'de-DE', direction: 'ltr', messages: {} };\n",
                    localesDts: "export declare const de_DE: { id: string; direction: string; messages: Record<string, unknown> };\n"
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow("Missing export: es_ES");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime export has wrong id", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "de-DE", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow('Locale id mismatch for export es_ES: expected "es-ES", received "de-DE"');
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime export has invalid direction", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "horizontal", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow('Invalid locale direction for export es_ES: received "horizontal", expected "ltr" or "rtl"');
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime export direction does not match expected direction", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "rtl", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES", direction: "ltr" }]
                    })
                ).toThrow('Locale direction mismatch for export es_ES: expected "ltr", received "rtl"');
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime export does not conform to locale structure", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: "export const es_ES = { id: 'es-ES', direction: 'ltr' };\n",
                    localesDts: "export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n"
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow("Invalid locale messages structure for export: es_ES");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when runtime package is missing getLocaleDateInputFormat in @nanahoshi/mona-ui/i18n", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n',
                    i18nMjs: "export function getLocaleTimeInputFormat() {};\n"
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow(/does not provide an export named 'getLocaleDateInputFormat'|Missing export getLocaleDateInputFormat/);
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when TypeScript consumer compilation fails due to type mismatch in locales", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: "export {};\n"
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow("Consumer TypeScript compilation failed");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when TypeScript consumer compilation fails due to type mismatch in i18n helpers", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n',
                    i18nDts: `
export type LocaleFirstDayOfWeek = "monday" | "sunday";
export declare function getLocaleDateInputFormat(locale: string): number;
export declare function getLocaleTimeInputFormat(locale: string, options?: unknown): string;
export declare function getLocaleDateTimeInputFormat(locale: string, options?: unknown): string;
export declare function getLocaleFirstDayOfWeek(locale: string): LocaleFirstDayOfWeek;
`
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow("Consumer TypeScript compilation failed");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });

        it("fails when TypeScript consumer compilation detects unneeded ts-expect-error if locale is optional in i18n helpers", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const es_ES = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n',
                    i18nDts: `
export type LocaleFirstDayOfWeek = "monday" | "sunday";
export declare function getLocaleDateInputFormat(locale: string): string;
export declare function getLocaleTimeInputFormat(locale?: string, options?: unknown): string;
export declare function getLocaleDateTimeInputFormat(locale: string, options?: unknown): string;
export declare function getLocaleFirstDayOfWeek(locale: string): LocaleFirstDayOfWeek;
`
                });

                expect(() =>
                    runConsumerSmokeTest({
                        distDir: fakeDist,
                        expectedLocales: [{ symbol: "es_ES", id: "es-ES" }]
                    })
                ).toThrow("Consumer TypeScript compilation failed");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
            }
        });
    });

    describe("verifyBuiltPackage missing file checks", () => {
        it("fails when runtime target file does not exist on disk", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./types/locales.d.ts",
                                default: "./missing-locales.mjs"
                            }
                        }
                    })
                );
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("Exported runtime file not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when types declaration file does not exist on disk", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(join(tempDir, "locales.mjs"), "export {};");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./types/missing.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("TypeScript declaration file not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when i18n runtime target file does not exist on disk", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(join(tempDir, "locales.mjs"), "export {};");
                writeFileSync(join(tempDir, "locales.d.ts"), "export {};");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            },
                            "./i18n": {
                                types: "./types/i18n.d.ts",
                                default: "./missing-i18n.mjs"
                            }
                        }
                    })
                );
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("Exported runtime file not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when i18n types declaration file does not exist on disk", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const pkgPath = join(tempDir, "package.json");
                writeFileSync(join(tempDir, "locales.mjs"), "export {};");
                writeFileSync(join(tempDir, "locales.d.ts"), "export {};");
                writeFileSync(join(tempDir, "i18n.mjs"), "export {};");
                writeFileSync(
                    pkgPath,
                    JSON.stringify({
                        name: "test-pkg",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            },
                            "./i18n": {
                                types: "./types/missing-i18n.d.ts",
                                default: "./i18n.mjs"
                            }
                        }
                    })
                );
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("TypeScript declaration file not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails before runtime smoke when source locales include one valid plus one malformed locale", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "pkg-verify-dist-"));
            const fakeLocales = mkdtempSync(join(tmpdir(), "pkg-verify-locales-"));
            try {
                // Setup valid built package output
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const MONA_ES_ES_LOCALE = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const MONA_ES_ES_LOCALE: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                // Setup source locales: es-es (valid) and de-de (malformed - missing official locale export)
                const esFolder = join(fakeLocales, "es-es");
                const deFolder = join(fakeLocales, "de-de");
                mkdirSync(esFolder, { recursive: true });
                mkdirSync(deFolder, { recursive: true });

                writeFileSync(
                    join(fakeLocales, "public-api.ts"),
                    'export { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";\n'
                );
                writeFileSync(
                    join(esFolder, "es-es.messages.ts"),
                    'import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const ES_ES_MESSAGES = {} satisfies MonaLocaleMessages;\n'
                );
                writeFileSync(
                    join(esFolder, "es-es.locale.ts"),
                    'import type { MonaLocale } from "@nanahoshi/mona-ui/i18n";\nimport { ES_ES_MESSAGES } from "./es-es.messages";\nexport const MONA_ES_ES_LOCALE = { direction: "ltr", id: "es-ES", messages: ES_ES_MESSAGES } satisfies MonaLocale;\n'
                );

                writeFileSync(
                    join(deFolder, "de-de.messages.ts"),
                    'import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";\nexport const DE_DE_MESSAGES = {} satisfies MonaLocaleMessages;\n'
                );
                writeFileSync(
                    join(deFolder, "de-de.locale.ts"),
                    'export const NOT_AN_OFFICIAL_LOCALE = { foo: "bar" };\n'
                );

                expect(() =>
                    verifyBuiltPackage({
                        distDir: fakeDist,
                        sourceLocalesDir: fakeLocales
                    })
                ).toThrow("Cannot verify package: source locale audit failed with");
            } finally {
                rmSync(fakeDist, { recursive: true, force: true });
                rmSync(fakeLocales, { recursive: true, force: true });
            }
        });

        it("fails when THIRD_PARTY_NOTICES.md is missing from dist", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: null
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("Third-party notices file not found");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when THIRD_PARTY_NOTICES.md is missing required Unicode CLDR notice", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: "# Third-Party Notices\n\nSome unrelated library notice.\n"
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("missing required Unicode CLDR notice");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when THIRD_PARTY_NOTICES.md has keyword-only placeholder without exact license body", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: "# Third-Party Notices\n\n## Unicode CLDR\n\nUnicode License v3 placeholder only.\n"
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("does not contain the exact canonical Unicode CLDR license");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when license has changed copyright wording", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const altered = CANONICAL_CLDR_LICENSE.replace("Copyright © 2015-2024 Unicode, Inc.", "Copyright © 1991-2024 Unicode, Inc. All rights reserved.");
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: `# Third-Party Notices\n\n## Unicode CLDR\n\nUnicode License v3\n\n\`\`\`\n${altered}\n\`\`\`\n`
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("does not contain the exact canonical Unicode CLDR license");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when license is missing upstream NOTICE TO USER section", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const altered = CANONICAL_CLDR_LICENSE.replace(/NOTICE TO USER:[\s\S]*?USE THE DATA FILES OR SOFTWARE\./, "");
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: `# Third-Party Notices\n\n## Unicode CLDR\n\nUnicode License v3\n\n\`\`\`\n${altered}\n\`\`\`\n`
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("does not contain the exact canonical Unicode CLDR license");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when license is missing SPDX line", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const altered = CANONICAL_CLDR_LICENSE.replace("SPDX-License-Identifier: Unicode-3.0", "");
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: `# Third-Party Notices\n\n## Unicode CLDR\n\nUnicode License v3\n\n\`\`\`\n${altered}\n\`\`\`\n`
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("does not contain the exact canonical Unicode CLDR license");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("fails when license body is truncated", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const truncated = CANONICAL_CLDR_LICENSE.slice(0, Math.floor(CANONICAL_CLDR_LICENSE.length / 2));
                populateFakeDist(tempDir, {
                    localesMjs: "export {};",
                    localesDts: "export {};",
                    i18nMjs: "export {};",
                    i18nDts: "export {};",
                    thirdPartyNotices: `# Third-Party Notices\n\n## Unicode CLDR\n\nUnicode License v3\n\n\`\`\`\n${truncated}\n\`\`\`\n`
                });
                expect(() => verifyBuiltPackage({ distDir: tempDir })).toThrow("does not contain the exact canonical Unicode CLDR license");
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("passes when exact canonical license body is embedded in THIRD_PARTY_NOTICES.md", () => {
            const tempDir = mkdtempSync(join(tmpdir(), "pkg-verify-test-"));
            try {
                const noticeFile = join(tempDir, "THIRD_PARTY_NOTICES.md");
                writeFileSync(noticeFile, DEFAULT_THIRD_PARTY_NOTICES);
                expect(() => verifyThirdPartyNotices(noticeFile)).not.toThrow();
            } finally {
                rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it("verifies root THIRD_PARTY_NOTICES.md and projects/mona-ui/THIRD_PARTY_NOTICES.md are identical", () => {
            const rootNotice = readFileSync(resolve(process.cwd(), "THIRD_PARTY_NOTICES.md"), "utf-8").replace(/\r\n/g, "\n");
            const libNotice = readFileSync(resolve(process.cwd(), "projects/mona-ui/THIRD_PARTY_NOTICES.md"), "utf-8").replace(/\r\n/g, "\n");
            expect(rootNotice).toBe(libNotice);
        });

        it("fails when root and projects/mona-ui third-party notices differ", () => {
            const fakeRepo = mkdtempSync(join(tmpdir(), "fake-repo-"));
            const fakeDist = join(fakeRepo, "dist/mona-ui");
            const fakeLocales = join(fakeRepo, "projects/mona-ui/locales");
            mkdirSync(fakeDist, { recursive: true });
            mkdirSync(fakeLocales, { recursive: true });
            mkdirSync(join(fakeRepo, "scripts/cldr"), { recursive: true });

            try {
                writeFileSync(join(fakeRepo, "scripts/cldr/LICENSE"), CANONICAL_CLDR_LICENSE);
                writeFileSync(join(fakeRepo, "THIRD_PARTY_NOTICES.md"), DEFAULT_THIRD_PARTY_NOTICES);
                writeFileSync(join(fakeRepo, "projects/mona-ui/THIRD_PARTY_NOTICES.md"), DEFAULT_THIRD_PARTY_NOTICES + "\n// modified\n");
                populateFakeDist(fakeDist, {
                    localesMjs: 'export const MONA_ES_ES_LOCALE = { id: "es-ES", direction: "ltr", messages: {} };\n',
                    localesDts: 'export declare const MONA_ES_ES_LOCALE: { id: string; direction: string; messages: Record<string, unknown> };\n'
                });

                const esFolder = join(fakeLocales, "es-es");
                mkdirSync(esFolder, { recursive: true });
                writeFileSync(join(fakeLocales, "public-api.ts"), 'export { MONA_ES_ES_LOCALE } from "./es-es/es-es.locale";\n');
                writeFileSync(join(esFolder, "es-es.messages.ts"), 'export const ES_ES_MESSAGES = {};\n');
                writeFileSync(join(esFolder, "es-es.locale.ts"), 'export const MONA_ES_ES_LOCALE = { direction: "ltr", id: "es-ES", messages: {} };\n');

                expect(() =>
                    verifyBuiltPackage({
                        distDir: fakeDist,
                        sourceLocalesDir: fakeLocales,
                        repoRoot: fakeRepo,
                        tscPath: resolveTypeScriptCompilerPath(process.cwd())
                    })
                ).toThrow("Repository notice mismatch");
            } finally {
                rmSync(fakeRepo, { recursive: true, force: true });
            }
        });
    });
});
