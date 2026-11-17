import { formatNumber } from "@nanahoshi/mona-ui/i18n";
import type { FileUploadRejection } from "../models/FileUploadRejection";

/** The checks a file must pass to be added. */
export interface FileUploadRules {
    /** Lowercase `accept` tokens: extensions such as `.pdf`, and MIME types such as `image/png` or `image/*`. */
    readonly accept: readonly string[];
    readonly maxFileSize: number | null;
    readonly minFileSize: number | null;
}

const FILE_SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

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

/** Why a file fails the checks, or null when it passes them. The type is checked first, then the size. */
export function checkFile(file: File, rules: FileUploadRules): FileUploadRejection | null {
    if (!matchesAccept(file, rules.accept)) {
        return "type";
    }
    if (rules.maxFileSize != null && file.size > rules.maxFileSize) {
        return "maxFileSize";
    }
    if (rules.minFileSize != null && file.size < rules.minFileSize) {
        return "minFileSize";
    }
    return null;
}

/** Whether two files are the same file chosen twice: same name, size, type and modification time. */
export function isSameFile(a: File, b: File): boolean {
    return a.name === b.name && a.size === b.size && a.type === b.type && a.lastModified === b.lastModified;
}

/** Whether two lists hold the same files in the same order. */
export function isSameFileList(a: readonly File[], b: readonly File[]): boolean {
    return a.length === b.length && a.every((file, index) => file === b[index]);
}

/**
 * A file size in the locale, in the largest unit that keeps it at 1 or more: "512 bytes", "1.5 kB", "20 MB". Units are
 * multiples of 1024, as limits are usually written (`5 * 1024 * 1024`), so that limit reads as "5 MB".
 */
export function formatFileSize(bytes: number, localeId: string): string {
    let value = Math.max(0, bytes);
    let unit = 0;
    while (value >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
        value /= 1024;
        unit++;
    }
    return formatNumber(value, localeId, {
        maximumFractionDigits: unit === 0 || value >= 100 ? 0 : 1,
        style: "unit",
        unit: FILE_SIZE_UNITS[unit],
        unitDisplay: unit === 0 ? "long" : "short"
    });
}

/**
 * The `accept` tokens as the person picking files reads them: extensions in capitals without the dot (`PDF`), MIME
 * types as they are, joined as alternatives in the locale ("PDF, PNG or image/*").
 */
export function describeAccept(accept: readonly string[], localeId: string): string {
    const names = [...new Set(accept.map(token => (token.startsWith(".") ? token.slice(1).toUpperCase() : token)))];
    try {
        return new Intl.ListFormat(localeId, { type: "disjunction" }).format(names);
    } catch {
        return names.join(", ");
    }
}
