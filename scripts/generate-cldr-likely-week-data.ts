import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLDR_VERSION = "46";
const SOURCE_URL = `https://raw.githubusercontent.com/unicode-org/cldr-json/refs/tags/${CLDR_VERSION}.0.0/cldr-json/cldr-core/supplemental/likelySubtags.json`;

const FRIDAY_FIRST_REGIONS = new Set(["MV"]);
const SATURDAY_FIRST_REGIONS = new Set([
    "AF", "BH", "DJ", "DZ", "EG", "IQ", "IR", "JO", "KW", "LY", "OM", "QA", "SD", "SY"
]);
const SUNDAY_FIRST_REGIONS = new Set([
    "AG", "AS", "BD", "BR", "BS", "BT", "BW", "BZ", "CA", "CO", "DM", "DO", "ET",
    "GT", "GU", "HK", "HN", "ID", "IL", "IN", "IS", "JM", "JP", "KE", "KH", "KR",
    "LA", "MH", "MM", "MO", "MT", "MX", "MZ", "NI", "NP", "PA", "PE", "PH", "PK",
    "PR", "PT", "PY", "SA", "SG", "SV", "TH", "TT", "TW", "UM", "US", "VE", "VI",
    "WS", "YE", "ZA", "ZW"
]);

function getFirstDayForRegion(region: string): string {
    if (FRIDAY_FIRST_REGIONS.has(region)) return "friday";
    if (SATURDAY_FIRST_REGIONS.has(region)) return "saturday";
    if (SUNDAY_FIRST_REGIONS.has(region)) return "sunday";
    return "monday";
}

function extractRegion(maximizedTag: string): string | null {
    const subtags = maximizedTag.split(/[_-]/);
    for (let i = 1; i < subtags.length; i++) {
        if (/^[a-zA-Z]{2}$|^\d{3}$/.test(subtags[i])) {
            return subtags[i].toUpperCase();
        }
    }
    return null;
}

async function main(): Promise<void> {
    console.log(`Fetching CLDR ${CLDR_VERSION} likelySubtags from: ${SOURCE_URL}`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) {
        throw new Error(`Failed to fetch CLDR likelySubtags: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as { supplemental: { likelySubtags: Record<string, string> } };
    const likelySubtags = json.supplemental.likelySubtags;

    const fridayTags: string[] = [];
    const saturdayTags: string[] = [];
    const sundayTags: string[] = [];
    const baseLangFirstDay = new Map<string, string>();

    for (const [key, maximized] of Object.entries(likelySubtags)) {
        const keySubtags = key.split(/[_-]/);
        const hasRegionOrVariant = keySubtags.slice(1).some(s => /^[a-zA-Z]{2}$|^\d{3}$/.test(s) || s.length > 4);
        if (hasRegionOrVariant) continue;
        if (key === "und" || key.startsWith("und-") || key.startsWith("und_")) continue;

        const region = extractRegion(maximized);
        if (!region) continue;
        const firstDay = getFirstDayForRegion(region);

        const normalizedKey = keySubtags.map((s, idx) => {
            if (idx === 0) return s.toLowerCase();
            if (s.length === 4) return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
            return s;
        }).join("-");

        if (keySubtags.length === 1) {
            baseLangFirstDay.set(normalizedKey, firstDay);
        }

        if (firstDay === "friday") fridayTags.push(normalizedKey);
        else if (firstDay === "saturday") saturdayTags.push(normalizedKey);
        else if (firstDay === "sunday") sundayTags.push(normalizedKey);
    }

    // Identify script overrides: lang-Script where territory is Monday but base lang is non-Monday
    const mondayScriptOverrides: string[] = [];
    for (const [key, maximized] of Object.entries(likelySubtags)) {
        const keySubtags = key.split(/[_-]/);
        if (keySubtags.length === 2 && keySubtags[1].length === 4 && keySubtags[0] !== "und") {
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

    console.log(`Resolved tags — Friday: ${fridayTags.length}, Saturday: ${saturdayTags.length}, Sunday: ${sundayTags.length}, Monday script overrides: ${mondayScriptOverrides.length}`);

    const formatSet = (items: string[], indent: number): string => {
        const spaces = " ".repeat(indent);
        return items.map(item => `${spaces}"${item}"`).join(",\n");
    };

    const targetFile = path.resolve(__dirname, "../projects/mona-ui/i18n/utilities/locale-week-likely-data.ts");

    const content = `import type { LocaleFirstDayOfWeek } from "./locale-week-data";

/**
 * Pinned Unicode CLDR release: ${CLDR_VERSION} / Unicode 16.0
 * Source: common/supplemental/supplementalData.xml (weekData/firstDay) + likelySubtags.json
 * Default territory ("001") is Monday.
 * Generated by scripts/generate-cldr-likely-week-data.ts from the pinned CLDR dataset.
 * Update from the pinned CLDR dataset rather than editing ad hoc.
 */
export const CLDR_LIKELY_SUBTAGS_VERSION = "${CLDR_VERSION}";

// Base language and language-script tags whose CLDR likely territory is Friday-first
export const LIKELY_FRIDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(fridayTags, 4)}
]);

// Base language and language-script tags whose CLDR likely territory is Saturday-first
export const LIKELY_SATURDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(saturdayTags, 4)}
]);

// Base language and language-script tags whose CLDR likely territory is Sunday-first
export const LIKELY_SUNDAY_FIRST_TAGS: ReadonlySet<string> = new Set([
${formatSet(sundayTags, 4)}
]);

// Specific language-script combinations that resolve to Monday in CLDR despite their base language resolving to non-Monday
export const LIKELY_MONDAY_SCRIPT_OVERRIDES: ReadonlySet<string> = new Set([
${formatSet(mondayScriptOverrides, 4)}
]);

/**
 * Resolves the likely first day of week for a base language tag or language-script tag
 * when native Intl.Locale.maximize() is unavailable.
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

    fs.writeFileSync(targetFile, content, "utf8");
    console.log(`Generated ${targetFile} (${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
