import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CLDR_VERSION = "46";
export const UNICODE_VERSION = "16.0";
export const CLDR_JSON_TAG = "46.0.0";

const LIKELY_SUBTAGS_URL = `https://raw.githubusercontent.com/unicode-org/cldr-json/refs/tags/${CLDR_JSON_TAG}/cldr-json/cldr-core/supplemental/likelySubtags.json`;
const WEEK_DATA_URL = `https://raw.githubusercontent.com/unicode-org/cldr-json/refs/tags/${CLDR_JSON_TAG}/cldr-json/cldr-core/supplemental/weekData.json`;

export interface CldrSources {
    readonly likelySubtags: Record<string, string>;
    readonly weekDataFirstDay: Record<string, string>;
}

export async function loadCldrSources(forceFetch = false): Promise<CldrSources> {
    const cldrDir = path.resolve(__dirname, "cldr");
    const likelyFile = path.join(cldrDir, "likelySubtags.json");
    const weekFile = path.join(cldrDir, "weekData.json");

    if (!forceFetch && fs.existsSync(likelyFile) && fs.existsSync(weekFile)) {
        const likelyJson = JSON.parse(fs.readFileSync(likelyFile, "utf8"));
        const weekJson = JSON.parse(fs.readFileSync(weekFile, "utf8"));
        return {
            likelySubtags: likelyJson.supplemental.likelySubtags,
            weekDataFirstDay: weekJson.supplemental.weekData.firstDay
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

    const likelyJson = (await likelyRes.json()) as { supplemental: { likelySubtags: Record<string, string> } };
    const weekJson = (await weekRes.json()) as { supplemental: { weekData: { firstDay: Record<string, string> } } };

    return {
        likelySubtags: likelyJson.supplemental.likelySubtags,
        weekDataFirstDay: weekJson.supplemental.weekData.firstDay
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

async function main(): Promise<void> {
    const isCheckMode = process.argv.includes("--check");
    const forceFetch = process.argv.includes("--fetch");

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
