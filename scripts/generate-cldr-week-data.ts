import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CLDR_VERSION = "46";
export const UNICODE_VERSION = "16.0";
export const CLDR_JSON_TAG = "46.0.0";

export const LIKELY_SUBTAGS_URL = `https://raw.githubusercontent.com/unicode-org/cldr-json/refs/tags/${CLDR_JSON_TAG}/cldr-json/cldr-core/supplemental/likelySubtags.json`;
export const WEEK_DATA_URL = `https://raw.githubusercontent.com/unicode-org/cldr-json/refs/tags/${CLDR_JSON_TAG}/cldr-json/cldr-core/supplemental/weekData.json`;

export interface CldrSources {
    readonly likelySubtags: Record<string, string>;
    readonly weekDataFirstDay: Record<string, string>;
}

export interface CldrProvenanceFile {
    readonly url: string;
    readonly sha256: string;
}

export interface CldrProvenance {
    readonly cldrVersion: string;
    readonly cldrJsonTag: string;
    readonly unicodeVersion: string;
    readonly files: {
        readonly "likelySubtags.json": CldrProvenanceFile;
        readonly "weekData.json": CldrProvenanceFile;
        readonly [filename: string]: CldrProvenanceFile;
    };
}

export interface CldrVersionedDocument {
    readonly supplemental?: {
        readonly version?: {
            readonly _cldrVersion?: string;
            readonly _unicodeVersion?: string;
        };
        readonly likelySubtags?: Record<string, string>;
        readonly weekData?: {
            readonly firstDay?: Record<string, string>;
        };
    };
}

export function computeSha256(content: Buffer | string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

export function normalizeUnicodeVersion(version: string): string {
    const parts = version.trim().split(".");
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}`;
    }
    return version.trim();
}

export function validateCldrProvenance(
    provenance: CldrProvenance,
    fileContents: Record<string, Buffer | string>,
    options?: {
        expectedCldrVersion?: string;
        expectedCldrJsonTag?: string;
        expectedUnicodeVersion?: string;
        expectedUrls?: Record<string, string>;
    }
): void {
    const expectedCldrVersion = options?.expectedCldrVersion ?? CLDR_VERSION;
    const expectedCldrJsonTag = options?.expectedCldrJsonTag ?? CLDR_JSON_TAG;
    const expectedUnicodeVersion = options?.expectedUnicodeVersion ?? UNICODE_VERSION;
    const expectedUrls: Record<string, string> = options?.expectedUrls ?? {
        "likelySubtags.json": LIKELY_SUBTAGS_URL,
        "weekData.json": WEEK_DATA_URL
    };

    if (!provenance || typeof provenance !== "object") {
        throw new Error("Invalid provenance data: expected an object");
    }

    if (provenance.cldrVersion !== expectedCldrVersion) {
        throw new Error(
            `CLDR provenance version mismatch: expected CLDR ${expectedCldrVersion}, but provenance declares CLDR ${provenance.cldrVersion}.`
        );
    }

    if (provenance.cldrJsonTag !== expectedCldrJsonTag) {
        throw new Error(
            `CLDR provenance tag mismatch: expected tag ${expectedCldrJsonTag}, but provenance declares tag ${provenance.cldrJsonTag}.`
        );
    }

    if (normalizeUnicodeVersion(provenance.unicodeVersion) !== normalizeUnicodeVersion(expectedUnicodeVersion)) {
        throw new Error(
            `CLDR provenance Unicode version mismatch: expected Unicode ${expectedUnicodeVersion}, but provenance declares Unicode ${provenance.unicodeVersion}.`
        );
    }

    if (!provenance.files || typeof provenance.files !== "object") {
        throw new Error("Invalid provenance data: missing 'files' dictionary");
    }

    for (const [filename, content] of Object.entries(fileContents)) {
        const fileMeta = provenance.files[filename];
        if (!fileMeta) {
            throw new Error(`CLDR provenance entry missing for file: ${filename}`);
        }
        const expectedUrl = expectedUrls[filename];
        if (expectedUrl && fileMeta.url !== expectedUrl) {
            throw new Error(
                `CLDR provenance source URL mismatch for ${filename}:\n` +
                `Expected: ${expectedUrl}\n` +
                `Actual:   ${fileMeta.url}`
            );
        }
        const actualHash = computeSha256(content);
        if (actualHash !== fileMeta.sha256) {
            throw new Error(
                `CLDR source integrity check failed:\n` +
                `${filename} SHA-256 does not match provenance.json.\n` +
                `Expected: ${fileMeta.sha256}\n` +
                `Actual:   ${actualHash}\n` +
                `Run the documented CLDR source-update workflow.`
            );
        }
    }
}

export function validateCldrSourceVersions(
    fileJsonMap: Record<string, unknown>,
    options?: {
        expectedCldrVersion?: string;
        expectedUnicodeVersion?: string;
    }
): void {
    const expectedCldrVersion = options?.expectedCldrVersion ?? CLDR_VERSION;
    const expectedUnicodeVersion = options?.expectedUnicodeVersion ?? UNICODE_VERSION;

    for (const [filename, rawJson] of Object.entries(fileJsonMap)) {
        const doc = rawJson as CldrVersionedDocument | undefined;
        const versionObj = doc?.supplemental?.version;
        if (!versionObj || typeof versionObj !== "object") {
            throw new Error(`CLDR source version metadata missing in ${filename} (expected supplemental.version)`);
        }

        const sourceCldr = versionObj._cldrVersion;
        if (!sourceCldr || typeof sourceCldr !== "string") {
            throw new Error(`CLDR source _cldrVersion missing in ${filename}`);
        }

        if (sourceCldr !== expectedCldrVersion) {
            throw new Error(
                `CLDR source version mismatch in ${filename}: expected CLDR ${expectedCldrVersion}, but ${filename} declares CLDR ${sourceCldr}.`
            );
        }

        const sourceUnicode = versionObj._unicodeVersion;
        if (!sourceUnicode || typeof sourceUnicode !== "string") {
            throw new Error(`CLDR source _unicodeVersion missing in ${filename}`);
        }

        if (normalizeUnicodeVersion(sourceUnicode) !== normalizeUnicodeVersion(expectedUnicodeVersion)) {
            throw new Error(
                `CLDR source Unicode version mismatch in ${filename}: expected Unicode ${expectedUnicodeVersion}, but ${filename} declares Unicode ${sourceUnicode}.`
            );
        }
    }
}

export async function loadCldrSources(
    optionsOrForceFetch: boolean | { readonly forceFetch?: boolean; readonly cldrDir?: string } = false
): Promise<CldrSources> {
    const forceFetch =
        typeof optionsOrForceFetch === "boolean"
            ? optionsOrForceFetch
            : (optionsOrForceFetch?.forceFetch ?? false);
    const cldrDir =
        typeof optionsOrForceFetch === "object" && optionsOrForceFetch.cldrDir
            ? optionsOrForceFetch.cldrDir
            : path.resolve(__dirname, "cldr");

    const likelyFile = path.join(cldrDir, "likelySubtags.json");
    const weekFile = path.join(cldrDir, "weekData.json");
    const provFile = path.join(cldrDir, "provenance.json");

    if (!forceFetch) {
        if (!fs.existsSync(likelyFile)) {
            throw new Error(
                `Pinned CLDR source file is missing:\n${likelyFile}\n\n` +
                `Normal generation/check mode is hermetic and will not fetch missing inputs.\n` +
                `Run "npm run update:cldr-week-sources" to restore or update the pinned source set.`
            );
        }
        if (!fs.existsSync(weekFile)) {
            throw new Error(
                `Pinned CLDR source file is missing:\n${weekFile}\n\n` +
                `Normal generation/check mode is hermetic and will not fetch missing inputs.\n` +
                `Run "npm run update:cldr-week-sources" to restore or update the pinned source set.`
            );
        }
        if (!fs.existsSync(provFile)) {
            throw new Error(
                `Pinned CLDR provenance file is missing:\n${provFile}\n\n` +
                `Normal generation/check mode is hermetic and will not fetch missing inputs.\n` +
                `Run "npm run update:cldr-week-sources" to restore or update the pinned source set.`
            );
        }

        const provRaw = fs.readFileSync(provFile, "utf8");
        const provenance: CldrProvenance = JSON.parse(provRaw);

        const likelyRaw = fs.readFileSync(likelyFile);
        const weekRaw = fs.readFileSync(weekFile);

        validateCldrProvenance(provenance, {
            "likelySubtags.json": likelyRaw,
            "weekData.json": weekRaw
        });

        const likelyJson = JSON.parse(likelyRaw.toString("utf8")) as CldrVersionedDocument;
        const weekJson = JSON.parse(weekRaw.toString("utf8")) as CldrVersionedDocument;

        validateCldrSourceVersions({
            "likelySubtags.json": likelyJson,
            "weekData.json": weekJson
        });

        return {
            likelySubtags: likelyJson.supplemental?.likelySubtags ?? {},
            weekDataFirstDay: weekJson.supplemental?.weekData?.firstDay ?? {}
        };
    }

    console.log(`Fetching CLDR ${CLDR_VERSION} sources from GitHub...`);
    const [likelyRes, weekRes] = await Promise.all([
        fetch(LIKELY_SUBTAGS_URL),
        fetch(WEEK_DATA_URL)
    ]);

    if (!likelyRes.ok) {
        throw new Error(`Failed to fetch likelySubtags: ${likelyRes.status} ${likelyRes.statusText}`);
    }
    if (!weekRes.ok) {
        throw new Error(`Failed to fetch weekData: ${weekRes.status} ${weekRes.statusText}`);
    }

    const likelyJson = (await likelyRes.json()) as CldrVersionedDocument;
    const weekJson = (await weekRes.json()) as CldrVersionedDocument;

    validateCldrSourceVersions({
        "likelySubtags.json": likelyJson,
        "weekData.json": weekJson
    });

    return {
        likelySubtags: likelyJson.supplemental?.likelySubtags ?? {},
        weekDataFirstDay: weekJson.supplemental?.weekData?.firstDay ?? {}
    };
}

export function extractRegion(maximizedTag: string): string | null {
    const subtags = maximizedTag.split(/[_-]/);
    if (!subtags[0] || subtags[0].length <= 1) {
        return null;
    }
    for (let i = 1; i < subtags.length; i++) {
        if (/^[a-zA-Z]{2}$|^\d{3}$/.test(subtags[i])) {
            return subtags[i].toUpperCase();
        }
    }
    return null;
}

export function generateWeekDataModuleContent(sources: CldrSources): string {
    const { likelySubtags, weekDataFirstDay } = sources;

    const fridayRegions: string[] = [];
    const saturdayRegions: string[] = [];
    const sundayRegions: string[] = [];

    for (const [code, day] of Object.entries(weekDataFirstDay)) {
        if (code.includes("-") || code === "001") {
            continue;
        }
        if (day === "fri") {
            fridayRegions.push(code);
        } else if (day === "sat") {
            saturdayRegions.push(code);
        } else if (day === "sun") {
            sundayRegions.push(code);
        }
    }

    fridayRegions.sort();
    saturdayRegions.sort();
    sundayRegions.sort();

    const fridayRegionSet = new Set(fridayRegions);
    const saturdayRegionSet = new Set(saturdayRegions);
    const sundayRegionSet = new Set(sundayRegions);

    const getFirstDayForRegion = (region: string): string => {
        if (fridayRegionSet.has(region)) return "friday";
        if (saturdayRegionSet.has(region)) return "saturday";
        if (sundayRegionSet.has(region)) return "sunday";
        return "monday";
    };

    const fridayTags: string[] = [];
    const saturdayTags: string[] = [];
    const sundayTags: string[] = [];
    const baseLangFirstDay = new Map<string, string>();

    for (const [key, maximized] of Object.entries(likelySubtags)) {
        const keySubtags = key.split(/[_-]/);
        const hasRegionOrVariant = keySubtags.slice(1).some(s => /^[a-zA-Z]{2}$|^\d{3}$/.test(s) || s.length > 4);
        if (hasRegionOrVariant) {
            continue;
        }

        const region = extractRegion(maximized);
        if (!region) {
            continue;
        }
        const firstDay = getFirstDayForRegion(region);

        const normalizedKey = keySubtags.map((s, idx) => {
            if (idx === 0) return s.toLowerCase();
            if (s.length === 4) return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
            return s;
        }).join("-");

        if (keySubtags.length === 1) {
            baseLangFirstDay.set(normalizedKey, firstDay);
        }

        if (firstDay === "friday") {
            fridayTags.push(normalizedKey);
        } else if (firstDay === "saturday") {
            saturdayTags.push(normalizedKey);
        } else if (firstDay === "sunday") {
            sundayTags.push(normalizedKey);
        }
    }

    // Per CLDR UTS #35 Add Likely Subtags, und-* scripts without explicit entries fall back to und (en-Latn-US -> Sunday)
    for (const s of ["Latf", "Latg", "Latn"]) {
        const tag = `und-${s}`;
        if (!sundayTags.includes(tag)) {
            sundayTags.push(tag);
        }
    }

    // Identify script overrides: lang-Script (or und-Script) where territory is Monday but base lang resolves to non-Monday
    const mondayScriptOverrides: string[] = [];
    for (const [key, maximized] of Object.entries(likelySubtags)) {
        const keySubtags = key.split(/[_-]/);
        if (keySubtags.length === 2 && keySubtags[1].length === 4) {
            const lang = keySubtags[0].toLowerCase();
            const script = keySubtags[1].charAt(0).toUpperCase() + keySubtags[1].slice(1).toLowerCase();
            const langScript = `${lang}-${script}`;
            const region = extractRegion(maximized);
            if (region && getFirstDayForRegion(region) === "monday") {
                const parentDay = baseLangFirstDay.get(lang);
                if (parentDay && parentDay !== "monday") {
                    mondayScriptOverrides.push(langScript);
                }
            }
        }
    }

    fridayTags.sort();
    saturdayTags.sort();
    sundayTags.sort();
    mondayScriptOverrides.sort();

    const formatSet = (items: string[], indent: number): string => {
        const spaces = " ".repeat(indent);
        return items.map(item => `${spaces}"${item}"`).join(",\n");
    };

    return `import type { LocaleFirstDayOfWeek } from "./locale-week-data";

/**
 * Pinned Unicode CLDR release: ${CLDR_VERSION} / Unicode ${UNICODE_VERSION}
 * Sources:
 *   - cldr-core/supplemental/weekData.json (weekData/firstDay)
 *   - cldr-core/supplemental/likelySubtags.json
 * Default territory ("001") is Monday.
 * Generated by scripts/generate-cldr-week-data.ts from the pinned CLDR dataset.
 * Update from the pinned CLDR dataset rather than editing ad hoc.
 */
export const CLDR_WEEK_DATA_VERSION = "${CLDR_VERSION}";
export const CLDR_LIKELY_SUBTAGS_VERSION = "${CLDR_VERSION}";

// Territories where firstDay is Friday (CLDR weekData/firstDay day="fri")
export const FRIDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
${formatSet(fridayRegions, 4)}
]);

// Territories where firstDay is Saturday (CLDR weekData/firstDay day="sat")
export const SATURDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
${formatSet(saturdayRegions, 4)}
]);

// Territories where firstDay is Sunday (CLDR weekData/firstDay day="sun")
export const SUNDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
${formatSet(sundayRegions, 4)}
]);

// Base language, undefined-language, and language-script tags whose CLDR likely territory is Friday-first
export const LIKELY_FRIDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(fridayTags, 4)}
]);

// Base language, undefined-language, and language-script tags whose CLDR likely territory is Saturday-first
export const LIKELY_SATURDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(saturdayTags, 4)}
]);

// Base language, undefined-language, and language-script tags whose CLDR likely territory is Sunday-first
export const LIKELY_SUNDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(sundayTags, 4)}
]);

// Specific language-script combinations that resolve to Monday in CLDR despite their base language resolving to non-Monday
export const LIKELY_MONDAY_SCRIPT_OVERRIDES: ReadonlySet<string> = new Set([
${formatSet(mondayScriptOverrides, 4)}
]);

/**
 * Resolves the likely first day of week for a base language tag, undefined-language tag,
 * or language-script tag when native Intl.Locale.maximize() is unavailable.
 */
export function resolveLikelyFirstDayOfWeek(baseTag: string): LocaleFirstDayOfWeek | null {
    if (LIKELY_MONDAY_SCRIPT_OVERRIDES.has(baseTag)) {
        return "monday";
    }
    if (LIKELY_FRIDAY_FIRST_TAGS.has(baseTag)) {
        return "friday";
    }
    if (LIKELY_SATURDAY_FIRST_TAGS.has(baseTag)) {
        return "saturday";
    }
    if (LIKELY_SUNDAY_FIRST_TAGS.has(baseTag)) {
        return "sunday";
    }
    return null;
}
`;
}

function normalizeNewlines(str: string): string {
    return str.replace(/\r\n/g, "\n").trim();
}

export async function updateCldrSources(options?: { readonly cldrDir?: string; readonly targetFile?: string }): Promise<void> {
    const cldrDir = options?.cldrDir ?? path.resolve(__dirname, "cldr");
    const likelyFile = path.join(cldrDir, "likelySubtags.json");
    const weekFile = path.join(cldrDir, "weekData.json");
    const provFile = path.join(cldrDir, "provenance.json");
    const targetFile =
        options?.targetFile ??
        path.resolve(__dirname, "../projects/mona-ui/i18n/utilities/locale-week-likely-data.ts");

    console.log(`Updating CLDR sources to CLDR ${CLDR_VERSION} (tag: ${CLDR_JSON_TAG}, Unicode: ${UNICODE_VERSION})...`);
    const [likelyRes, weekRes] = await Promise.all([
        fetch(LIKELY_SUBTAGS_URL),
        fetch(WEEK_DATA_URL)
    ]);

    if (!likelyRes.ok) {
        throw new Error(`Failed to fetch likelySubtags: ${likelyRes.status} ${likelyRes.statusText}`);
    }
    if (!weekRes.ok) {
        throw new Error(`Failed to fetch weekData: ${weekRes.status} ${weekRes.statusText}`);
    }

    const likelyBuffer = Buffer.from(await likelyRes.arrayBuffer());
    const weekBuffer = Buffer.from(await weekRes.arrayBuffer());

    const likelyJson = JSON.parse(likelyBuffer.toString("utf8")) as CldrVersionedDocument;
    const weekJson = JSON.parse(weekBuffer.toString("utf8")) as CldrVersionedDocument;

    validateCldrSourceVersions({
        "likelySubtags.json": likelyJson,
        "weekData.json": weekJson
    });

    const likelySha256 = computeSha256(likelyBuffer);
    const weekSha256 = computeSha256(weekBuffer);

    const provenance: CldrProvenance = {
        cldrVersion: CLDR_VERSION,
        cldrJsonTag: CLDR_JSON_TAG,
        unicodeVersion: UNICODE_VERSION,
        files: {
            "likelySubtags.json": {
                url: LIKELY_SUBTAGS_URL,
                sha256: likelySha256
            },
            "weekData.json": {
                url: WEEK_DATA_URL,
                sha256: weekSha256
            }
        }
    };

    fs.mkdirSync(cldrDir, { recursive: true });
    fs.writeFileSync(likelyFile, likelyBuffer);
    fs.writeFileSync(weekFile, weekBuffer);
    fs.writeFileSync(provFile, JSON.stringify(provenance, null, 2) + "\n", "utf8");

    const sources: CldrSources = {
        likelySubtags: likelyJson.supplemental?.likelySubtags ?? {},
        weekDataFirstDay: weekJson.supplemental?.weekData?.firstDay ?? {}
    };

    const generatedContent = generateWeekDataModuleContent(sources);
    fs.writeFileSync(targetFile, generatedContent, "utf8");

    console.log(`Updated CLDR sources in ${cldrDir}`);
    console.log(`Updated provenance in ${provFile}`);
    console.log(`Regenerated ${targetFile} (${(Buffer.byteLength(generatedContent) / 1024).toFixed(1)} KB)`);
}

async function main(): Promise<void> {
    const isCheckMode = process.argv.includes("--check");
    const isUpdateSourcesMode = process.argv.includes("--update-sources");
    const forceFetch = process.argv.includes("--fetch");

    if (isUpdateSourcesMode) {
        await updateCldrSources();
        return;
    }

    const sources = await loadCldrSources(forceFetch);
    const generatedContent = generateWeekDataModuleContent(sources);

    const targetFile = path.resolve(__dirname, "../projects/mona-ui/i18n/utilities/locale-week-likely-data.ts");

    if (isCheckMode) {
        if (!fs.existsSync(targetFile)) {
            console.error(`Generated file not found: ${targetFile}`);
            console.error("Run: npm run generate:cldr-week-data");
            process.exit(1);
        }

        const existingContent = fs.readFileSync(targetFile, "utf8");
        if (normalizeNewlines(generatedContent) !== normalizeNewlines(existingContent)) {
            console.error("Generated CLDR week data is stale.");
            console.error("Run: npm run generate:cldr-week-data");
            process.exit(1);
        }

        console.log(`CLDR week data version: ${CLDR_VERSION}`);
        console.log("CLDR source provenance & hashes: OK");
        console.log("Territory first-day data: OK");
        console.log("Likely first-day data: OK");
        console.log("Generated files are up to date.");
        return;
    }

    fs.writeFileSync(targetFile, generatedContent, "utf8");
    console.log(`Generated ${targetFile} (${(Buffer.byteLength(generatedContent) / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
