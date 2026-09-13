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
    const normalized = localeId.replace(/_/g, "-");
    const subtags = normalized.split("-");
    let inUExtension = false;

    for (let i = 0; i < subtags.length; i++) {
        const subtag = subtags[i].toLowerCase();
        if (subtag.length === 1) {
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
 * Resolves the 2-letter or 3-digit region code from a locale tag.
 * Uses Intl.Locale.region, then Intl.Locale.maximize().region.
 * If Intl.Locale is unavailable or fails, manually parses the base language tag
 * while safely stripping Unicode (-u-) and private-use (-x-) extensions to prevent
 * mistaking extension keys (like '-ca-') for region subtags.
 */
export function resolveLikelyRegion(localeId: string): string | null {
    if (!localeId) {
        return null;
    }
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(localeId);
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
        // Fallback safely to manual base tag parser
    }

    // Manual BCP-47 fallback: strip singleton extensions (-u-, -x-, -t-, etc.) and everything following
    const normalized = localeId.replace(/_/g, "-");
    const basePart = normalized.split(/-[a-zA-Z0-9]-/)[0];
    const subtags = basePart.split("-");
    for (let i = 1; i < subtags.length; i++) {
        const subtag = subtags[i];
        if (/^[a-zA-Z]{2}$|^\d{3}$/.test(subtag)) {
            return subtag.toUpperCase();
        }
    }

    return null;
}

/**
 * Pure fallback resolver when Intl.Locale.weekInfo / getWeekInfo() is unavailable.
 */
export function resolveFallbackFirstDayOfWeek(localeId: string): LocaleFirstDayOfWeek {
    const explicitOverride = resolveExplicitFirstDayOverride(localeId);
    if (explicitOverride) {
        return explicitOverride;
    }

    const region = resolveLikelyRegion(localeId);
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
    const normalized = localeId.replace(/_/g, "-");
    const baseLang = normalized.split(/-[a-zA-Z0-9]-/)[0].split("-")[0]?.toLowerCase();
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
    if (!localeId) {
        return "monday";
    }
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(localeId) as unknown as LocaleWeekInfoCompat;
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
    return resolveFallbackFirstDayOfWeek(localeId);
}
