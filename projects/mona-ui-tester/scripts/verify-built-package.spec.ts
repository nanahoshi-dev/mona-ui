import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveExportTargets, verifyBuiltPackage } from "./verify-built-package";

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
    });
});
