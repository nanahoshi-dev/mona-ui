export type LocaleFirstDayOfWeek =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

/**
 * Pinned Unicode CLDR release: 46 / Unicode 16.0
 * Source: common/supplemental/supplementalData.xml -> weekData/firstDay
 * Default territory ("001") is Monday.
 * Update from the pinned CLDR dataset rather than editing ad hoc.
 */
export const CLDR_WEEK_DATA_VERSION = "46";

// Territories where firstDay is Friday (CLDR weekData/firstDay day="fri")
export const FRIDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
    "MV"
]);

// Territories where firstDay is Saturday (CLDR weekData/firstDay day="sat")
export const SATURDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
    "AF",
    "BH",
    "DJ",
    "DZ",
    "EG",
    "IQ",
    "IR",
    "JO",
    "KW",
    "LY",
    "OM",
    "QA",
    "SD",
    "SY"
]);

// Territories where firstDay is Sunday (CLDR weekData/firstDay day="sun")
export const SUNDAY_FIRST_REGIONS: ReadonlySet<string> = new Set([
    "AG", "AS", "BD", "BR", "BS", "BT", "BW", "BZ", "CA", "CO", "DM", "DO", "ET",
    "GT", "GU", "HK", "HN", "ID", "IL", "IN", "IS", "JM", "JP", "KE", "KH", "KR",
    "LA", "MH", "MM", "MO", "MT", "MX", "MZ", "NI", "NP", "PA", "PE", "PH", "PK",
    "PR", "PT", "PY", "SA", "SG", "SV", "TH", "TT", "TW", "UM", "US", "VE", "VI",
    "WS", "YE", "ZA", "ZW"
]);

const FW_TO_FIRST_DAY: Record<string, LocaleFirstDayOfWeek> = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday"
};

const ISO_DAY_MAP: Record<number, LocaleFirstDayOfWeek> = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
    7: "sunday"
};

interface LocaleWeekInfoCompat {
    readonly weekInfo?: {
        readonly firstDay?: number;
    };
    getWeekInfo?: () => {
        readonly firstDay?: number;
    };
}

/**
 * Extracts explicit Unicode extension 'fw' (first day of week) subtag if present.
 * Example: 'en-US-u-fw-mon' -> 'monday'.
 */
export function resolveExplicitFirstDayOverride(localeId: string): LocaleFirstDayOfWeek | null {
    if (!localeId) {
        return null;
    }
    const normalized = localeId.trim().replace(/_/g, "-");
    const subtags = normalized.split("-");
    let inUExtension = false;

    for (let i = 0; i < subtags.length; i++) {
        const subtag = subtags[i].toLowerCase();
        if (subtag.length === 1) {
            if (subtag === "x") {
                break;
            }
            inUExtension = subtag === "u";
            continue;
        }
        if (inUExtension && subtag === "fw") {
            const nextSubtag = subtags[i + 1]?.toLowerCase();
            if (nextSubtag && nextSubtag in FW_TO_FIRST_DAY) {
                return FW_TO_FIRST_DAY[nextSubtag];
            }
        }
    }
    return null;
}

/**
 * Resolves the 2-letter ISO region code from a locale tag.
 * 1. Uses Intl.Locale.region, then Intl.Locale.maximize().region.
 * 2. If Intl.Locale is unavailable or fails, canonicalizes via Intl.getCanonicalLocales() to map numeric M49 region codes to alpha-2.
 * 3. Falls back to manual base language tag parsing (safely stripping extension singletons like -u- or -x-) for 2-letter alpha territory subtags.
 * Private-use tags (e.g. 'x-US') without a standard language tag are ignored.
 */
export function resolveLikelyRegion(localeId: string): string | null {
    if (!localeId) {
        return null;
    }
    const normalized = localeId.trim().replace(/_/g, "-");
    if (!normalized || /^[xX](?:-|$)/.test(normalized)) {
        return null;
    }

    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(normalized);
            if (loc.region) {
                return loc.region.toUpperCase();
            }
            if (typeof loc.maximize === "function") {
                const maximized = loc.maximize();
                if (maximized.region) {
                    return maximized.region.toUpperCase();
                }
            }
        }
    } catch {
        // Fallback safely to canonicalization / manual base tag parser
    }

    let tagToParse = normalized;
    try {
        if (typeof Intl !== "undefined" && typeof Intl.getCanonicalLocales === "function") {
            const canonical = Intl.getCanonicalLocales(normalized)[0];
            if (canonical) {
                tagToParse = canonical;
            }
        }
    } catch {
        // Continue with normalized tag
    }

    // Manual BCP-47 fallback: strip singleton extensions (-u-, -x-, -t-, etc.) and everything following
    const basePart = tagToParse.split(/-[a-zA-Z0-9]-/)[0];
    const subtags = basePart.split("-");
    if (!subtags[0] || subtags[0].length <= 1) {
        return null;
    }
    for (let i = 1; i < subtags.length; i++) {
        const subtag = subtags[i];
        if (/^[a-zA-Z]{2}$/.test(subtag)) {
            return subtag.toUpperCase();
        }
    }

    return null;
}

/**
 * Pure fallback resolver when Intl.Locale.weekInfo / getWeekInfo() is unavailable.
 */
export function resolveFallbackFirstDayOfWeek(localeId: string): LocaleFirstDayOfWeek {
    const normalized = (localeId ?? "").trim();
    if (!normalized) {
        return "monday";
    }

    const explicitOverride = resolveExplicitFirstDayOverride(normalized);
    if (explicitOverride) {
        return explicitOverride;
    }

    const region = resolveLikelyRegion(normalized);
    if (region) {
        if (FRIDAY_FIRST_REGIONS.has(region)) {
            return "friday";
        }
        if (SATURDAY_FIRST_REGIONS.has(region)) {
            return "saturday";
        }
        if (SUNDAY_FIRST_REGIONS.has(region)) {
            return "sunday";
        }
        return "monday";
    }

    // Language-only fallback for primitive environments where maximize() was unavailable
    const tag = normalized.replace(/_/g, "-");
    if (/^[xX](?:-|$)/.test(tag)) {
        return "monday";
    }
    const basePart = tag.split(/-[a-zA-Z0-9]-/)[0];
    const subtags = basePart.split("-");
    if (!subtags[0] || subtags[0].length <= 1) {
        return "monday";
    }
    const baseLang = subtags[0].toLowerCase();
    if (baseLang === "ja" || baseLang === "ko") {
        return "sunday";
    }
    if (baseLang === "fa" || baseLang === "ar") {
        return "saturday";
    }
    return "monday";
}

/**
 * Pure, uncached resolver for locale first day of week.
 * 1. Checks Intl.Locale.weekInfo / getWeekInfo()
 * 2. Falls back to deterministic CLDR fallback
 */
export function resolveLocaleFirstDayOfWeek(localeId: string): LocaleFirstDayOfWeek {
    const normalized = (localeId ?? "").trim();
    if (!normalized) {
        return "monday";
    }
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(normalized) as unknown as LocaleWeekInfoCompat;
            const weekInfo = loc.weekInfo ?? loc.getWeekInfo?.();
            if (weekInfo && typeof weekInfo.firstDay === "number") {
                const dayNum = weekInfo.firstDay === 0 ? 7 : weekInfo.firstDay;
                const mapped = ISO_DAY_MAP[dayNum];
                if (mapped) {
                    return mapped;
                }
            }
        }
    } catch {
        // fallback
    }
    return resolveFallbackFirstDayOfWeek(normalized);
}
