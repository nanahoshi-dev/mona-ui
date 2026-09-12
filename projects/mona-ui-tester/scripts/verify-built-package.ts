import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function verifyBuiltPackage(distDir: string = resolve(process.cwd(), "dist/mona-ui")): void {
    console.log("Verifying built package output at:", distDir);

    const pkgJsonPath = resolve(distDir, "package.json");
    if (!existsSync(pkgJsonPath)) {
        throw new Error(`Built package.json not found at: ${pkgJsonPath}. Did you run "npm run build"?`);
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const exports = pkgJson.exports;

    if (!exports) {
        throw new Error('Built package.json has no "exports" field');
    }

    // Check for ./locales export
    const localesExport = exports["./locales"];
    if (!localesExport) {
        throw new Error('Built package.json is missing exports["./locales"] entry point');
    }
    console.log('✓ Found exports["./locales"] in dist/mona-ui/package.json');

    // Check emitted files
    const localesDir = resolve(distDir, "locales");
    if (!existsSync(localesDir)) {
        throw new Error(`Built locales directory not found at: ${localesDir}`);
    }
    console.log("✓ Emitted locales directory exists");

    // Check exported symbols
    const fesmPath = resolve(distDir, "fesm2022/nanahoshi-mona-ui-locales.mjs");
    if (!existsSync(fesmPath)) {
        throw new Error(`FESM bundle for locales not found at: ${fesmPath}`);
    }

    const fesmContent = readFileSync(fesmPath, "utf-8");
    if (!fesmContent.includes("MONA_ES_ES_LOCALE")) {
        throw new Error("MONA_ES_ES_LOCALE is not exported from the built locales FESM bundle");
    }
    console.log("✓ MONA_ES_ES_LOCALE is exported from built locales bundle");

    // Check type definition
    const typesRelPath = typeof localesExport === "object" && localesExport !== null && "types" in localesExport
        ? (localesExport as { types: string }).types
        : null;
    if (!typesRelPath) {
        throw new Error('exports["./locales"] is missing a "types" declaration path');
    }
    const typesPath = resolve(distDir, typesRelPath);
    if (!existsSync(typesPath)) {
        throw new Error(`TypeScript declaration file not found at: ${typesPath}`);
    }
    console.log(`✓ TypeScript declaration file verified at ${typesRelPath}`);

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
