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
 * Parses the exact media type from a data URI.
 * Returns null if the data URI is malformed or lacks a media type.
 */
export function parseDataUrlMediaType(url: string): string | null {
    if (!url.startsWith("data:")) {
        return null;
    }
    const match = /^data:([^;,]+)(?:;[^,]*)?,/i.exec(url);
    return match ? match[1].toLowerCase().trim() : null;
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
 * Decodes the raw binary payload of a data URI into a Uint8Array, enforcing byte limits.
 */
export function decodeDataUrlPayload(url: string): { readonly bytes: Uint8Array; readonly mediaType: string } {
    if (!url.startsWith("data:")) {
        throw new ChartExportError("resource-load-failed", "Resource is not a valid data URI.");
    }

    const commaIndex = url.indexOf(",");
    if (commaIndex < 0) {
        throw new ChartExportError("resource-load-failed", "Malformed data URI resource: missing comma separator.");
    }

    const mediaType = parseDataUrlMediaType(url);
    if (!mediaType) {
        throw new ChartExportError("resource-load-failed", "Data URI resource is missing a valid media type.");
    }

    const payload = url.slice(commaIndex + 1);
    const header = url.slice(0, commaIndex + 1);
    const isBase64 = /;base64,/i.test(header);

    let bytes: Uint8Array;
    if (isBase64) {
        try {
            const binary = atob(payload.trim());
            bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
        } catch (err) {
            throw new ChartExportError("resource-load-failed", "Malformed base64 data URI resource.", { cause: err });
        }
    } else {
        try {
            const decoded = decodeURIComponent(payload);
            bytes = new TextEncoder().encode(decoded);
        } catch (err) {
            throw new ChartExportError("resource-load-failed", "Malformed percent-encoded data URI resource.", { cause: err });
        }
    }

    if (bytes.length > MAX_EXPORT_RESOURCE_BYTES) {
        throw new ChartExportError(
            "too-large",
            `Data URI resource byte size (${bytes.length} bytes) exceeds maximum limit (${MAX_EXPORT_RESOURCE_BYTES} bytes).`
        );
    }

    return { bytes, mediaType };
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
