import { ChartExportError } from "../../models/chart-export.models";

export type ChartExportRasterMediaType = "image/png" | "image/jpeg" | "image/webp";

export const SUPPORTED_RASTER_MEDIA_TYPES: readonly ChartExportRasterMediaType[] = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

/**
 * Maximum decoded byte size allowed for a single template resource (10 MB).
 */
export const MAX_EXPORT_RESOURCE_BYTES = 10 * 1024 * 1024;

/**
 * Maximum aggregate byte size allowed across all template resources in one export transaction (50 MB).
 */
export const MAX_EXPORT_RESOURCE_TOTAL_BYTES = 50 * 1024 * 1024;

/**
 * Maximum decoded pixel edge length allowed for a single template resource.
 */
export const MAX_EXPORT_RESOURCE_DIMENSION = 16384;

/**
 * Maximum decoded pixel count allowed for a single template resource (64 Mi-pixels).
 */
export const MAX_EXPORT_RESOURCE_PIXELS = 67108864;

/**
 * Exact parse result of a data URI header. The payload is kept byte-faithful:
 * scheme and media type are compared case-insensitively, but the payload text is
 * never case-modified because base64 payloads are case-sensitive.
 */
export interface ParsedDataUri {
    readonly isBase64: boolean;
    readonly mediaType: string;
    readonly payload: string;
}

/**
 * Parses a data URI into its exact media type, base64 marker, and raw payload.
 * The scheme is compared case-insensitively; the payload text is kept byte-faithful.
 * Returns null when the URI is not a data URI or has no comma-separated payload.
 */
export function parseDataUri(url: string): ParsedDataUri | null {
    if (!/^\s*data:/i.test(url)) {
        return null;
    }

    const commaIndex = url.indexOf(",");
    if (commaIndex < 0) {
        return null;
    }

    const header = url.slice(url.indexOf(":") + 1, commaIndex);
    const headerMatch = /^([^;,]*)(;[^;,]*)*$/.exec(header);
    if (!headerMatch) {
        return null;
    }

    const mediaType = headerMatch[1].toLowerCase().trim();
    return {
        isBase64: /;base64$/i.test(header),
        mediaType,
        payload: url.slice(commaIndex + 1)
    };
}

/**
 * Parses the exact media type from a data URI.
 * Returns null if the data URI is malformed or lacks a media type.
 */
export function parseDataUrlMediaType(url: string): string | null {
    return parseDataUri(url)?.mediaType ?? null;
}

/**
 * Checks whether a parsed media type belongs to the certified raster media allowlist.
 */
export function isSupportedRasterMediaType(mediaType: string | null | undefined): mediaType is ChartExportRasterMediaType {
    if (!mediaType) {
        return false;
    }
    return (SUPPORTED_RASTER_MEDIA_TYPES as readonly string[]).includes(mediaType.toLowerCase().trim());
}

/**
 * Case-insensitive CSS url(...) token detection shared by the resource manager,
 * fragment isolator, and final SVG validator so discovery casing cannot drift.
 */
export function containsCssUrl(value: string | null | undefined): boolean {
    return !!value && /\burl\s*\(/i.test(value);
}

/**
 * Extracts all url(...) token values from a CSS value, case-insensitively.
 */
export function extractCssUrls(styleValue: string): string[] {
    if (!containsCssUrl(styleValue)) {
        return [];
    }
    const urls: string[] = [];
    const urlRegex = /\burl\s*\(\s*['"]?([^'")]+?)['"]?\s*\)/gi;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(styleValue)) !== null) {
        if (match[1]) {
            urls.push(match[1].trim());
        }
    }
    return urls;
}

/**
 * Detects the actual raster image type from magic bytes so a lying Content-Type
 * (or a text/html / JSON error page) can never become nominal image data (R4-02 / R5-02).
 */
export function sniffRasterImageType(bytes: Uint8Array): ChartExportRasterMediaType | null {
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return "image/png";
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
    }
    if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    ) {
        return "image/webp";
    }
    return null;
}

/**
 * Decodes a base64 payload into bytes. Throws a ChartExportError on malformed input.
 */
export function decodeBase64Payload(payload: string, context: string): Uint8Array {
    let binary: string;
    try {
        binary = atob(payload.trim());
    } catch (err) {
        throw new ChartExportError("resource-load-failed", `Malformed base64 ${context}.`, { cause: err });
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decodes the raw binary payload of a base64 data URI into a Uint8Array, enforcing byte limits.
 *
 * First-release policy (R6-08): raster data URI payloads must be base64-encoded.
 * Percent-encoded binary payloads are rejected explicitly because Unicode text
 * transcoding is not a byte-preserving binary decoder.
 */
export function decodeDataUrlPayload(url: string): { readonly bytes: Uint8Array; readonly mediaType: string } {
    const parsed = parseDataUri(url);
    if (!parsed) {
        throw new ChartExportError("resource-load-failed", "Resource is not a valid data URI.");
    }

    if (!parsed.mediaType) {
        throw new ChartExportError("resource-load-failed", "Data URI resource is missing a valid media type.");
    }

    if (!parsed.isBase64) {
        throw new ChartExportError(
            "resource-load-failed",
            "Percent-encoded data URI payloads are not supported for raster resources; use base64 encoding."
        );
    }

    // Approximate decoded size before allocating the decoded binary string (R6-06).
    const approxDecodedBytes = Math.floor((parsed.payload.length * 3) / 4);
    if (approxDecodedBytes > MAX_EXPORT_RESOURCE_BYTES) {
        throw new ChartExportError(
            "too-large",
            `Data URI resource decoded size (~${approxDecodedBytes} bytes) exceeds maximum limit (${MAX_EXPORT_RESOURCE_BYTES} bytes).`
        );
    }

    const bytes = decodeBase64Payload(parsed.payload, "data URI resource");

    if (bytes.length > MAX_EXPORT_RESOURCE_BYTES) {
        throw new ChartExportError(
            "too-large",
            `Data URI resource byte size (${bytes.length} bytes) exceeds maximum limit (${MAX_EXPORT_RESOURCE_BYTES} bytes).`
        );
    }

    return { bytes, mediaType: parsed.mediaType };
}

/**
 * Enforces the decoded image dimension/pixel safety budget for captured resources (R6-06).
 */
export function assertResourcePixelBudget(width: number, height: number, source: string): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template image resource '${source}' decoded to invalid or empty dimensions.`
        );
    }
    if (width > MAX_EXPORT_RESOURCE_DIMENSION || height > MAX_EXPORT_RESOURCE_DIMENSION) {
        throw new ChartExportError(
            "too-large",
            `Template image resource '${source}' decoded dimensions (${width}x${height}) exceed the maximum edge length (${MAX_EXPORT_RESOURCE_DIMENSION}).`
        );
    }
    const pixels = width * height;
    if (!Number.isSafeInteger(pixels) || pixels > MAX_EXPORT_RESOURCE_PIXELS) {
        throw new ChartExportError(
            "too-large",
            `Template image resource '${source}' decoded pixel count (${pixels}) exceeds the maximum (${MAX_EXPORT_RESOURCE_PIXELS} pixels).`
        );
    }
}

/**
 * Converts a Uint8Array into a base64 encoded string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
