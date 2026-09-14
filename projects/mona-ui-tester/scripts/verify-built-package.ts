import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { discoverOfficialLocales } from "./audit-locales";

export interface PackageVerificationOptions {
    canonicalLicensePath?: string;
    distDir?: string;
    repoRoot?: string;
    sourceLocalesDir?: string;
    tscPath?: string;
}

export function verifyThirdPartyNotices(
    noticePath: string,
    canonicalLicensePath?: string
): void {
    if (!existsSync(noticePath)) {
        throw new Error(`Third-party notices file not found at: ${noticePath}`);
    }
    const noticeContent = readFileSync(noticePath, "utf-8").replace(/\r\n/g, "\n");
    if (!noticeContent.includes("Unicode License") || !noticeContent.includes("CLDR")) {
        throw new Error(`Third-party notices file at ${noticePath} is missing required Unicode CLDR notice`);
    }

    const licensePath = canonicalLicensePath ?? resolve(process.cwd(), "scripts/cldr/LICENSE");
    if (!existsSync(licensePath)) {
        throw new Error(`Canonical CLDR license file not found at: ${licensePath}`);
    }

    const canonicalLicense = readFileSync(licensePath, "utf-8").replace(/\r\n/g, "\n").replace(/\n$/, "");
    if (!noticeContent.includes(canonicalLicense)) {
        throw new Error(
            `Third-party notices file at ${noticePath} does not contain the exact canonical Unicode CLDR license from ${licensePath}`
        );
    }
}

export interface ExpectedLocaleExport {
    readonly direction?: "ltr" | "rtl";
    readonly id: string;
    readonly symbol: string;
}

export interface ConsumerSmokeTestOptions {
    distDir: string;
    expectedLocales: readonly ExpectedLocaleExport[];
    repoRoot?: string;
    tscPath?: string;
}

export function resolveTypeScriptCompilerPath(repoRoot: string = process.cwd()): string {
    const tscPath = resolve(repoRoot, "node_modules/typescript/bin/tsc");
    if (!existsSync(tscPath)) {
        throw new Error(`Pinned TypeScript compiler not found at: ${tscPath}. Did you run "npm ci"?`);
    }
    return tscPath;
}

export function resolveExportTargets(
    pkgJsonPath: string,
    subpath: string = "./locales"
): { runtimeRelPath: string; typesRelPath: string } {
    if (!existsSync(pkgJsonPath)) {
        throw new Error(`Built package.json not found at: ${pkgJsonPath}. Did you run "npm run build"?`);
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const exports = pkgJson.exports;

    if (!exports || typeof exports !== "object") {
        throw new Error('Built package.json has no "exports" field');
    }

    const targetExport = exports[subpath];
    if (!targetExport) {
        throw new Error(`Built package.json is missing exports["${subpath}"] entry point`);
    }

    let runtimeRelPath: string | null = null;
    let typesRelPath: string | null = null;

    if (typeof targetExport === "string") {
        runtimeRelPath = targetExport;
    } else if (typeof targetExport === "object" && targetExport !== null) {
        runtimeRelPath = targetExport.import ?? targetExport.default ?? null;
        typesRelPath = targetExport.types ?? null;
    }

    if (!runtimeRelPath) {
        throw new Error(`exports["${subpath}"] is missing an "import" or "default" runtime target`);
    }

    if (!typesRelPath) {
        throw new Error(`exports["${subpath}"] is missing a "types" declaration path`);
    }

    return { runtimeRelPath, typesRelPath };
}

export function runConsumerSmokeTest(options: ConsumerSmokeTestOptions): void {
    const tscPath = options.tscPath ?? resolveTypeScriptCompilerPath(options.repoRoot ?? process.cwd());
    const tempDir = mkdtempSync(join(tmpdir(), "mona-consumer-smoke-"));
    try {
        const nmAt = join(tempDir, "node_modules", "@nanahoshi");
        mkdirSync(nmAt, { recursive: true });
        const pkgLink = join(nmAt, "mona-ui");
        symlinkSync(options.distDir, pkgLink, process.platform === "win32" ? "junction" : "dir");

        const repoNmAngular = join(options.repoRoot ?? process.cwd(), "node_modules", "@angular");
        if (existsSync(repoNmAngular)) {
            const nmAngular = join(tempDir, "node_modules", "@angular");
            symlinkSync(repoNmAngular, nmAngular, process.platform === "win32" ? "junction" : "dir");
        }

        // 1. Runtime ESM consumer smoke test
        const smokeScriptPath = join(tempDir, "smoke.mjs");
        const smokeScript = `
import "@angular/compiler";
import * as locales from "@nanahoshi/mona-ui/locales";
import {
    getLocaleDateInputFormat,
    getLocaleTimeInputFormat,
    getLocaleDateTimeInputFormat,
    getLocaleFirstDayOfWeek
} from "@nanahoshi/mona-ui/i18n";

const expectedLocales = ${JSON.stringify(options.expectedLocales)};
for (const expected of expectedLocales) {
    if (!(expected.symbol in locales)) {
        console.error("Missing export: " + expected.symbol);
        process.exit(1);
    }
    const loc = locales[expected.symbol];
    if (!loc || typeof loc !== "object") {
        console.error("Invalid locale object for export: " + expected.symbol);
        process.exit(1);
    }
    if (loc.id !== expected.id) {
        console.error(\`Locale id mismatch for export \${expected.symbol}: expected "\${expected.id}", received "\${loc.id}"\`);
        process.exit(1);
    }
    if (!loc.messages || typeof loc.messages !== "object") {
        console.error("Invalid locale messages structure for export: " + expected.symbol);
        process.exit(1);
    }
    if (expected.direction) {
        if (loc.direction !== expected.direction) {
            console.error(\`Locale direction mismatch for export \${expected.symbol}: expected "\${expected.direction}", received "\${loc.direction}"\`);
            process.exit(1);
        }
    } else {
        if (loc.direction !== "ltr" && loc.direction !== "rtl") {
            console.error(\`Invalid locale direction for export \${expected.symbol}: received "\${loc.direction}", expected "ltr" or "rtl"\`);
            process.exit(1);
        }
    }
}

if (typeof getLocaleDateInputFormat !== "function") {
    console.error("Missing export getLocaleDateInputFormat in @nanahoshi/mona-ui/i18n");
    process.exit(1);
}
if (typeof getLocaleTimeInputFormat !== "function") {
    console.error("Missing export getLocaleTimeInputFormat in @nanahoshi/mona-ui/i18n");
    process.exit(1);
}
if (typeof getLocaleDateTimeInputFormat !== "function") {
    console.error("Missing export getLocaleDateTimeInputFormat in @nanahoshi/mona-ui/i18n");
    process.exit(1);
}
if (typeof getLocaleFirstDayOfWeek !== "function") {
    console.error("Missing export getLocaleFirstDayOfWeek in @nanahoshi/mona-ui/i18n");
    process.exit(1);
}

const jaDateFormat = getLocaleDateInputFormat("ja-JP");
if (!jaDateFormat || typeof jaDateFormat !== "string") {
    console.error("Invalid getLocaleDateInputFormat output for ja-JP: " + jaDateFormat);
    process.exit(1);
}

const jaFirstDay = getLocaleFirstDayOfWeek("ja-JP");
if (jaFirstDay !== "sunday") {
    console.error("Invalid getLocaleFirstDayOfWeek output for ja-JP: " + jaFirstDay);
    process.exit(1);
}

const hasZhCn = expectedLocales.some(l => l.id === "zh-CN");
if (hasZhCn) {
    const zhCnDateFormat = getLocaleDateInputFormat("zh-CN");
    if (zhCnDateFormat !== "yyyy/MM/dd") {
        console.error("Invalid getLocaleDateInputFormat output for zh-CN: " + zhCnDateFormat);
        process.exit(1);
    }
    const zhCnFirstDay = getLocaleFirstDayOfWeek("zh-CN");
    if (zhCnFirstDay !== "monday") {
        console.error("Invalid getLocaleFirstDayOfWeek output for zh-CN: " + zhCnFirstDay);
        process.exit(1);
    }
}

const hasZhTw = expectedLocales.some(l => l.id === "zh-TW");
if (hasZhTw) {
    const zhTwDateFormat = getLocaleDateInputFormat("zh-TW");
    if (zhTwDateFormat !== "yyyy/MM/dd") {
        console.error("Invalid getLocaleDateInputFormat output for zh-TW: " + zhTwDateFormat);
        process.exit(1);
    }
    const zhTwFirstDay = getLocaleFirstDayOfWeek("zh-TW");
    if (zhTwFirstDay !== "sunday") {
        console.error("Invalid getLocaleFirstDayOfWeek output for zh-TW: " + zhTwFirstDay);
        process.exit(1);
    }
}

const hasKoKr = expectedLocales.some(l => l.id === "ko-KR");
if (hasKoKr) {
    const koDateFormat = getLocaleDateInputFormat("ko-KR");
    if (koDateFormat !== "yyyy. MM. dd.") {
        console.error("Invalid getLocaleDateInputFormat output for ko-KR: " + koDateFormat);
        process.exit(1);
    }
    const koTime12 = getLocaleTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: false });
    if (koTime12 !== "a hh:mm") {
        console.error("Invalid getLocaleTimeInputFormat output for ko-KR: " + koTime12);
        process.exit(1);
    }
    const koDateTime12 = getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "12", showSeconds: false });
    if (koDateTime12 !== "yyyy. MM. dd. a hh:mm") {
        console.error("Invalid getLocaleDateTimeInputFormat output for ko-KR: " + koDateTime12);
        process.exit(1);
    }
    const koFirstDay = getLocaleFirstDayOfWeek("ko-KR");
    if (koFirstDay !== "sunday") {
        console.error("Invalid getLocaleFirstDayOfWeek output for ko-KR: " + koFirstDay);
        process.exit(1);
    }
}

const hasArSa = expectedLocales.some(l => l.id === "ar-SA");
if (hasArSa) {
    const arSaDateFormat = getLocaleDateInputFormat("ar-SA");
    const arSaTime12 = getLocaleTimeInputFormat("ar-SA", { hourFormat: "12", showSeconds: false });
    const arSaDateTime12 = getLocaleDateTimeInputFormat("ar-SA", { hourFormat: "12", showSeconds: false });
    const bidiRegex = /[\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]/;
    if (bidiRegex.test(arSaDateFormat) || bidiRegex.test(arSaTime12) || bidiRegex.test(arSaDateTime12)) {
        console.error("Bidi control leak detected in ar-SA format derivation");
        process.exit(1);
    }
    if (arSaDateFormat !== "dd/MM/yyyy") {
        console.error("Invalid getLocaleDateInputFormat output for ar-SA: " + arSaDateFormat);
        process.exit(1);
    }
    if (arSaTime12 !== "hh:mm a") {
        console.error("Invalid getLocaleTimeInputFormat output for ar-SA: " + arSaTime12);
        process.exit(1);
    }
    if (arSaDateTime12 !== "dd/MM/yyyy، hh:mm a") {
        console.error("Invalid getLocaleDateTimeInputFormat output for ar-SA: " + arSaDateTime12);
        process.exit(1);
    }
    const arSaFirstDay = getLocaleFirstDayOfWeek("ar-SA");
    if (arSaFirstDay !== "sunday") {
        console.error("Invalid getLocaleFirstDayOfWeek output for ar-SA: " + arSaFirstDay);
        process.exit(1);
    }
}

const hasItIt = expectedLocales.some(l => l.id === "it-IT");
if (hasItIt) {
    const itDateFormat = getLocaleDateInputFormat("it-IT");
    if (itDateFormat !== "dd/MM/yyyy") {
        console.error("Invalid getLocaleDateInputFormat output for it-IT: " + itDateFormat);
        process.exit(1);
    }
    const itTime24 = getLocaleTimeInputFormat("it-IT", { hourFormat: "24", showSeconds: false });
    if (itTime24 !== "HH:mm") {
        console.error("Invalid getLocaleTimeInputFormat output for it-IT: " + itTime24);
        process.exit(1);
    }
    const itDateTime24 = getLocaleDateTimeInputFormat("it-IT", { hourFormat: "24", showSeconds: false });
    if (itDateTime24 !== "dd/MM/yyyy, HH:mm") {
        console.error("Invalid getLocaleDateTimeInputFormat output for it-IT: " + itDateTime24);
        process.exit(1);
    }
    const itFirstDay = getLocaleFirstDayOfWeek("it-IT");
    if (itFirstDay !== "monday") {
        console.error("Invalid getLocaleFirstDayOfWeek output for it-IT: " + itFirstDay);
        process.exit(1);
    }
}

console.log("Runtime package import verified successfully.");
`;
        writeFileSync(smokeScriptPath, smokeScript);

        try {
            execFileSync(process.execPath, [smokeScriptPath], {
                cwd: tempDir,
                stdio: ["ignore", "pipe", "pipe"],
                encoding: "utf-8"
            });
            console.log("✓ ESM consumer runtime import verified via package specifiers '@nanahoshi/mona-ui/locales' and '@nanahoshi/mona-ui/i18n'");
        } catch (err: unknown) {
            const execErr = err as { stderr?: string; stdout?: string; message?: string };
            throw new Error(`Consumer runtime import test failed:\n${execErr.stderr || execErr.stdout || execErr.message}`);
        }

        // 2. TypeScript consumer compilation test
        const symbols = options.expectedLocales.map(l => l.symbol);
        const consumerTsPath = join(tempDir, "consumer.ts");
        const consumerTs = `
import { ${symbols.join(", ")} } from "@nanahoshi/mona-ui/locales";
import {
    getLocaleDateInputFormat,
    getLocaleTimeInputFormat,
    getLocaleDateTimeInputFormat,
    getLocaleFirstDayOfWeek,
    type LocaleFirstDayOfWeek
} from "@nanahoshi/mona-ui/i18n";

${symbols
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

const testJaDate: string = getLocaleDateInputFormat("ja-JP");
const testJaTime: string = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
const testJaDateTime: string = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "24" });
const testJaFirstDay: LocaleFirstDayOfWeek = getLocaleFirstDayOfWeek("ja-JP");
void testJaDate;
void testJaTime;
void testJaDateTime;
void testJaFirstDay;

const testZhCnDate: string = getLocaleDateInputFormat("zh-CN");
const testZhCnFirstDay: LocaleFirstDayOfWeek = getLocaleFirstDayOfWeek("zh-CN");
const testZhTwDate: string = getLocaleDateInputFormat("zh-TW");
const testZhTwFirstDay: LocaleFirstDayOfWeek = getLocaleFirstDayOfWeek("zh-TW");
void testZhCnDate;
void testZhCnFirstDay;
void testZhTwDate;
void testZhTwFirstDay;

const testKoDate: string = getLocaleDateInputFormat("ko-KR");
const testKoTime: string = getLocaleTimeInputFormat("ko-KR", { hourFormat: "12" });
const testKoDateTime: string = getLocaleDateTimeInputFormat("ko-KR", { hourFormat: "24" });
const testKoFirstDay: LocaleFirstDayOfWeek = getLocaleFirstDayOfWeek("ko-KR");
void testKoDate;
void testKoTime;
void testKoDateTime;
void testKoFirstDay;

const testItDate: string = getLocaleDateInputFormat("it-IT");
const testItTime: string = getLocaleTimeInputFormat("it-IT", { hourFormat: "24" });
const testItDateTime: string = getLocaleDateTimeInputFormat("it-IT", { hourFormat: "24" });
const testItFirstDay: LocaleFirstDayOfWeek = getLocaleFirstDayOfWeek("it-IT");
void testItDate;
void testItTime;
void testItDateTime;
void testItFirstDay;

// @ts-expect-error Locale argument is required
getLocaleDateInputFormat();

// @ts-expect-error Locale argument is required
getLocaleTimeInputFormat();

// @ts-expect-error Locale argument is required
getLocaleDateTimeInputFormat();

// @ts-expect-error Locale argument is required
getLocaleFirstDayOfWeek();
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
            execFileSync(process.execPath, [tscPath, "--project", tsconfigPath], {
                cwd: tempDir,
                stdio: ["ignore", "pipe", "pipe"],
                encoding: "utf-8"
            });
            console.log("✓ TypeScript consumer compilation verified via NodeNext resolution");
        } catch (err: unknown) {
            const execErr = err as { stderr?: string; stdout?: string; message?: string };
            throw new Error(`Consumer TypeScript compilation failed:\n${execErr.stderr || execErr.stdout || execErr.message}`);
        }
    } finally {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // best-effort cleanup
        }
    }
}

export function verifyBuiltPackage(options: PackageVerificationOptions = {}): void {
    const distDir = resolve(options.distDir ?? resolve(process.cwd(), "dist/mona-ui"));
    const sourceLocalesDir = resolve(
        options.sourceLocalesDir ?? resolve(process.cwd(), "projects/mona-ui/locales")
    );
    const repoRoot = resolve(options.repoRoot ?? process.cwd());
    const tscPath = options.tscPath ?? resolveTypeScriptCompilerPath(repoRoot);

    console.log("Verifying built package output at:", distDir);

    const pkgJsonPath = resolve(distDir, "package.json");
    const { runtimeRelPath, typesRelPath } = resolveExportTargets(pkgJsonPath, "./locales");
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

    const i18nTargets = resolveExportTargets(pkgJsonPath, "./i18n");
    console.log('✓ Found exports["./i18n"] in dist/mona-ui/package.json');

    const i18nRuntimePath = resolve(distDir, i18nTargets.runtimeRelPath);
    if (!existsSync(i18nRuntimePath)) {
        throw new Error(`Exported runtime file not found at: ${i18nRuntimePath}`);
    }
    console.log(`✓ i18n runtime target verified at ${i18nTargets.runtimeRelPath}`);

    const i18nTypesPath = resolve(distDir, i18nTargets.typesRelPath);
    if (!existsSync(i18nTypesPath)) {
        throw new Error(`TypeScript declaration file not found at: ${i18nTypesPath}`);
    }
    console.log(`✓ i18n TypeScript declaration file verified at ${i18nTargets.typesRelPath}`);

    const noticePath = resolve(distDir, "THIRD_PARTY_NOTICES.md");
    const canonicalLicensePath = options.canonicalLicensePath ?? resolve(repoRoot, "scripts/cldr/LICENSE");
    verifyThirdPartyNotices(noticePath, canonicalLicensePath);
    console.log("✓ Third-party notices verified at THIRD_PARTY_NOTICES.md");

    const rootNoticePath = resolve(repoRoot, "THIRD_PARTY_NOTICES.md");
    const libNoticePath = resolve(repoRoot, "projects/mona-ui/THIRD_PARTY_NOTICES.md");
    if (existsSync(rootNoticePath) && existsSync(libNoticePath)) {
        const rootContent = readFileSync(rootNoticePath, "utf-8").replace(/\r\n/g, "\n");
        const libContent = readFileSync(libNoticePath, "utf-8").replace(/\r\n/g, "\n");
        if (rootContent !== libContent) {
            throw new Error(
                `Repository notice mismatch: ${rootNoticePath} and ${libNoticePath} differ`
            );
        }
    }

    const discovery = discoverOfficialLocales(sourceLocalesDir);
    if (discovery.violations.length > 0) {
        throw new Error(
            `Cannot verify package: source locale audit failed with ${discovery.violations.length} violation(s)`
        );
    }

    const expectedLocales: ExpectedLocaleExport[] = discovery.locales.map(l => {
        if (!l.localeExport) {
            throw new Error(`Internal invariant violation: locale "${l.folder}" has no official export symbol`);
        }
        return {
            symbol: l.localeExport,
            id: l.canonicalId,
            direction: l.direction
        };
    });

    if (expectedLocales.length === 0) {
        throw new Error(`No official locale symbols discovered in ${sourceLocalesDir}`);
    }
    console.log(`✓ Discovered official locale symbols: ${expectedLocales.map(l => l.symbol).join(", ")}`);
    console.log(`✓ Resolved hermetic TypeScript compiler at: ${tscPath}`);

    runConsumerSmokeTest({
        distDir,
        expectedLocales,
        tscPath,
        repoRoot
    });

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
