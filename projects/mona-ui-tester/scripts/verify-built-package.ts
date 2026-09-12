import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { discoverOfficialLocales } from "./audit-locales";

export interface PackageVerificationOptions {
    distDir?: string;
    sourceLocalesDir?: string;
}

export function resolveExportTargets(pkgJsonPath: string): { runtimeRelPath: string; typesRelPath: string } {
    if (!existsSync(pkgJsonPath)) {
        throw new Error(`Built package.json not found at: ${pkgJsonPath}. Did you run "npm run build"?`);
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const exports = pkgJson.exports;

    if (!exports || typeof exports !== "object") {
        throw new Error('Built package.json has no "exports" field');
    }

    const localesExport = exports["./locales"];
    if (!localesExport) {
        throw new Error('Built package.json is missing exports["./locales"] entry point');
    }

    let runtimeRelPath: string | null = null;
    let typesRelPath: string | null = null;

    if (typeof localesExport === "string") {
        runtimeRelPath = localesExport;
    } else if (typeof localesExport === "object" && localesExport !== null) {
        runtimeRelPath = localesExport.import ?? localesExport.default ?? null;
        typesRelPath = localesExport.types ?? null;
    }

    if (!runtimeRelPath) {
        throw new Error('exports["./locales"] is missing an "import" or "default" runtime target');
    }

    if (!typesRelPath) {
        throw new Error('exports["./locales"] is missing a "types" declaration path');
    }

    return { runtimeRelPath, typesRelPath };
}

export function verifyBuiltPackage(options: PackageVerificationOptions = {}): void {
    const distDir = resolve(options.distDir ?? resolve(process.cwd(), "dist/mona-ui"));
    const sourceLocalesDir = resolve(
        options.sourceLocalesDir ?? resolve(process.cwd(), "projects/mona-ui/locales")
    );

    console.log("Verifying built package output at:", distDir);

    const pkgJsonPath = resolve(distDir, "package.json");
    const { runtimeRelPath, typesRelPath } = resolveExportTargets(pkgJsonPath);
    console.log('✓ Found exports["./locales"] in dist/mona-ui/package.json');

    const runtimePath = resolve(distDir, runtimeRelPath);
    if (!existsSync(runtimePath)) {
        throw new Error(`Exported runtime file not found at: ${runtimePath}`);
    }
    console.log(`✓ Runtime target verified at ${runtimeRelPath}`);

    const typesPath = resolve(distDir, typesRelPath);
    if (!existsSync(typesPath)) {
        throw new Error(`TypeScript declaration file not found at: ${typesPath}`);
    }
    console.log(`✓ TypeScript declaration file verified at ${typesRelPath}`);

    const discovery = discoverOfficialLocales(sourceLocalesDir);
    if (discovery.violations.length > 0) {
        throw new Error(
            `Cannot verify package: source locale audit failed with ${discovery.violations.length} violation(s)`
        );
    }

    const expectedSymbols = discovery.locales.map(l => l.localeExport).filter(Boolean);
    if (expectedSymbols.length === 0) {
        throw new Error(`No official locale symbols discovered in ${sourceLocalesDir}`);
    }
    console.log(`✓ Discovered official locale symbols: ${expectedSymbols.join(", ")}`);

    const tempDir = mkdtempSync(join(tmpdir(), "mona-consumer-smoke-"));
    try {
        const nmAt = join(tempDir, "node_modules", "@nanahoshi");
        mkdirSync(nmAt, { recursive: true });
        const pkgLink = join(nmAt, "mona-ui");
        symlinkSync(distDir, pkgLink, process.platform === "win32" ? "junction" : "dir");

        // 1. Runtime ESM consumer smoke test
        const smokeScriptPath = join(tempDir, "smoke.mjs");
        const smokeScript = `
import * as locales from "@nanahoshi/mona-ui/locales";

const expected = ${JSON.stringify(expectedSymbols)};
for (const sym of expected) {
    if (!(sym in locales)) {
        console.error("Missing export: " + sym);
        process.exit(1);
    }
    const loc = locales[sym];
    if (!loc || typeof loc !== "object" || !loc.id || !loc.messages) {
        console.error("Invalid locale object structure for export: " + sym);
        process.exit(1);
    }
}
console.log("Runtime package import verified successfully.");
`;
        writeFileSync(smokeScriptPath, smokeScript);

        try {
            execSync(`node "${smokeScriptPath}"`, {
                cwd: tempDir,
                stdio: ["ignore", "pipe", "pipe"],
                encoding: "utf-8"
            });
            console.log("✓ ESM consumer runtime import verified via package specifier '@nanahoshi/mona-ui/locales'");
        } catch (err: any) {
            throw new Error(`Consumer runtime import test failed:\n${err.stderr || err.stdout || err.message}`);
        }

        // 2. TypeScript consumer compilation test
        const consumerTsPath = join(tempDir, "consumer.ts");
        const consumerTs = `
import { ${expectedSymbols.join(", ")} } from "@nanahoshi/mona-ui/locales";

${expectedSymbols
    .map(
        sym => `
const localeId_${sym}: string = ${sym}.id;
const dir_${sym}: string = ${sym}.direction;
const msgs_${sym}: Record<string, unknown> = ${sym}.messages;
void localeId_${sym};
void dir_${sym};
void msgs_${sym};
`
    )
    .join("\n")}
`;
        writeFileSync(consumerTsPath, consumerTs);

        const tsconfigPath = join(tempDir, "tsconfig.json");
        const tsconfig = {
            compilerOptions: {
                target: "ES2022",
                module: "NodeNext",
                moduleResolution: "NodeNext",
                noEmit: true,
                skipLibCheck: true
            },
            include: ["consumer.ts"]
        };
        writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

        try {
            execSync("npx tsc --project .", {
                cwd: tempDir,
                stdio: ["ignore", "pipe", "pipe"],
                encoding: "utf-8"
            });
            console.log("✓ TypeScript consumer compilation verified via NodeNext resolution");
        } catch (err: any) {
            throw new Error(`Consumer TypeScript compilation failed:\n${err.stderr || err.stdout || err.message}`);
        }
    } finally {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // best-effort cleanup
        }
    }

    console.log("\nPackage verification SUCCESS: All packaging criteria satisfied.");
}

if (
    process.env["VITEST"] !== "true" &&
    process.argv[1] &&
    (process.argv[1].endsWith("verify-built-package.ts") || process.argv[1].endsWith("verify-built-package.js"))
) {
    try {
        verifyBuiltPackage();
    } catch (err) {
        console.error("\nPackage verification FAILED:", (err as Error).message);
        process.exit(1);
    }
}
