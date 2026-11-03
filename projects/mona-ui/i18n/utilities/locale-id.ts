/**
 * Locale id used whenever a supplied id cannot be turned into a valid BCP 47 tag.
 * Matches the id of `MONA_DEFAULT_LOCALE`.
 */
export const MONA_FALLBACK_LOCALE_ID = "en-US";

const canonicalLocaleCache = new Map<string, string | null>();

/**
 * Converts a locale id to a canonical BCP 47 tag, or returns `null` when it is not a valid tag.
 *
 * POSIX/Java style ids are accepted: `en_US` becomes `en-US`, and an encoding or modifier suffix
 * (`de_DE.UTF-8`, `de_DE@euro`) is dropped.
 */
export function tryCanonicalizeLocaleId(localeId: string | null | undefined): string | null {
    const raw = (localeId ?? "").trim();
    if (!raw) {
        return null;
    }
    if (canonicalLocaleCache.has(raw)) {
        return canonicalLocaleCache.get(raw) ?? null;
    }
    let canonical: string | null = null;
    try {
        const tag = raw.replace(/[.@].*$/, "").replace(/_/g, "-");
        canonical = Intl.getCanonicalLocales(tag)[0] ?? null;
    } catch {
        canonical = null;
    }
    canonicalLocaleCache.set(raw, canonical);
    return canonical;
}

/**
 * Converts a locale id to a canonical BCP 47 tag. Ids that are empty or not valid tags resolve to
 * {@link MONA_FALLBACK_LOCALE_ID}, so every formatter receives the same, valid locale.
 */
export function canonicalizeLocaleId(localeId: string | null | undefined): string {
    return tryCanonicalizeLocaleId(localeId) ?? MONA_FALLBACK_LOCALE_ID;
}
