import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
    resolveExportTargets,
    resolveTypeScriptCompilerPath,
    runConsumerSmokeTest,
    verifyBuiltPackage
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

    describe("runConsumerSmokeTest", () => {
        it("succeeds when synthetic package exports expected locale matching runtime and types", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const es_ES = { id: "es-ES", direction: "ltr", messages: { greeting: "hola" } };\n'
                );
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                );

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

        it("fails when runtime package is missing expected export", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(join(fakeDist, "locales.mjs"), "export const de_DE = { id: 'de-DE', direction: 'ltr', messages: {} };\n");
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    "export declare const de_DE: { id: string; direction: string; messages: Record<string, unknown> };\n"
                );

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
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const es_ES = { id: "de-DE", direction: "ltr", messages: {} };\n'
                );
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                );

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
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const es_ES = { id: "es-ES", direction: "horizontal", messages: {} };\n'
                );
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                );

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
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const es_ES = { id: "es-ES", direction: "rtl", messages: {} };\n'
                );
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    'export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n'
                );

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
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(join(fakeDist, "locales.mjs"), "export const es_ES = { id: 'es-ES', direction: 'ltr' };\n");
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    "export declare const es_ES: { id: string; direction: string; messages: Record<string, unknown> };\n"
                );

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

        it("fails when TypeScript consumer compilation fails due to type mismatch", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "fake-dist-"));
            try {
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const es_ES = { id: "es-ES", direction: "ltr", messages: {} };\n'
                );
                writeFileSync(join(fakeDist, "locales.d.ts"), "export {};\n");

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

        it("fails before runtime smoke when source locales include one valid plus one malformed locale", () => {
            const fakeDist = mkdtempSync(join(tmpdir(), "pkg-verify-dist-"));
            const fakeLocales = mkdtempSync(join(tmpdir(), "pkg-verify-locales-"));
            try {
                // Setup valid built package output
                writeFileSync(
                    join(fakeDist, "package.json"),
                    JSON.stringify({
                        name: "@nanahoshi/mona-ui",
                        exports: {
                            "./locales": {
                                types: "./locales.d.ts",
                                default: "./locales.mjs"
                            }
                        }
                    })
                );
                writeFileSync(
                    join(fakeDist, "locales.mjs"),
                    'export const MONA_ES_ES_LOCALE = { id: "es-ES", direction: "ltr", messages: {} };\n'
                );
                writeFileSync(
                    join(fakeDist, "locales.d.ts"),
                    'export declare const MONA_ES_ES_LOCALE: { id: string; direction: string; messages: Record<string, unknown> };\n'
                );

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
    });
});
