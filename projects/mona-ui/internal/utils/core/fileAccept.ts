/** Splits an `accept` attribute into its lowercase tokens, dropping empty ones. */
export function parseAccept(accept: string | null | undefined): string[] {
    return (accept ?? "")
        .split(",")
        .map(token => token.trim().toLowerCase())
        .filter(token => token.length > 0);
}

/**
 * Whether a file matches one of the `accept` tokens, the way the browser's file dialog does: by its extension, its
 * whole MIME type, or a MIME type's first half such as `image/*`. No tokens accept every file.
 */
export function matchesAccept(file: File, accept: readonly string[]): boolean {
    if (accept.length === 0) {
        return true;
    }
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept.some(token => {
        if (token.startsWith(".")) {
            return name.endsWith(token);
        }
        if (token.endsWith("/*")) {
            return type.startsWith(token.slice(0, -1));
        }
        return type === token;
    });
}
