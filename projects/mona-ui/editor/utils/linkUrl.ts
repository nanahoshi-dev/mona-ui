const ALLOWED_SCHEME = /^(?:https?|mailto|tel):/i;
const ANY_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const RELATIVE = /^(?:\/|#|\?|\.\.?\/)/;
const BARE_HOST = /^[^\s/?#]+\.[^\s/?#]+/;

/**
 * Checks a link typed by the user and returns the URL to store, or `null` when it can't be used.
 *
 * - `http:`, `https:`, `mailto:` and `tel:` URLs are kept.
 * - Relative URLs (`/path`, `#anchor`, `?query`, `./file`) are kept.
 * - A bare host such as `example.com/page` gets `https://`.
 * - Any other scheme (`javascript:`, `data:`, `ftp:` …) and text with spaces is refused.
 */
export function normalizeLinkUrl(value: string): string | null {
    const url = value.trim();
    if (!url || /\s/.test(url)) {
        return null;
    }
    if (ALLOWED_SCHEME.test(url) || RELATIVE.test(url)) {
        return url;
    }
    if (ANY_SCHEME.test(url)) {
        return null;
    }
    return BARE_HOST.test(url) ? `https://${url}` : null;
}
