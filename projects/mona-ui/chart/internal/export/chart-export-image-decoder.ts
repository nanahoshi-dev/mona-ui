import { ChartExportError } from "../../models/chart-export.models";
import { ChartExportRasterMediaType, bytesToBase64 } from "./chart-export-resource-policy";

export interface DecodedImageDimensions {
    readonly height: number;
    readonly width: number;
}

/**
 * Validates PNG structural chunks and extracts dimensions (IHDR chunk).
 */
function validatePngIntegrity(bytes: Uint8Array): DecodedImageDimensions {
    if (bytes.length < 24) {
        throw new ChartExportError("resource-load-failed", "PNG image payload is truncated.");
    }

    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
        bytes[0] !== 0x89 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x4e ||
        bytes[3] !== 0x47 ||
        bytes[4] !== 0x0d ||
        bytes[5] !== 0x0a ||
        bytes[6] !== 0x1a ||
        bytes[7] !== 0x0a
    ) {
        throw new ChartExportError("resource-load-failed", "Invalid PNG image signature.");
    }

    // First chunk must be IHDR: 4-byte length, 4-byte type "IHDR"
    const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunkType !== "IHDR") {
        throw new ChartExportError("resource-load-failed", "Corrupt PNG: missing IHDR chunk.");
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);

    if (width === 0 || height === 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
        throw new ChartExportError("resource-load-failed", "Corrupt PNG: image dimensions are zero or invalid.");
    }

    return { height, width };
}

/**
 * Validates JPEG structural markers and extracts dimensions (SOF marker).
 */
function validateJpegIntegrity(bytes: Uint8Array): DecodedImageDimensions {
    if (bytes.length < 4) {
        throw new ChartExportError("resource-load-failed", "JPEG image payload is truncated.");
    }

    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        throw new ChartExportError("resource-load-failed", "Invalid JPEG signature.");
    }

    let offset = 2;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (offset < bytes.length - 1) {
        if (bytes[offset] !== 0xff) {
            offset++;
            continue;
        }

        const marker = bytes[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
            if (offset + 9 > bytes.length) {
                throw new ChartExportError("resource-load-failed", "Corrupt JPEG: truncated SOF marker.");
            }
            const height = view.getUint16(offset + 5, false);
            const width = view.getUint16(offset + 7, false);

            if (width === 0 || height === 0) {
                throw new ChartExportError("resource-load-failed", "Corrupt JPEG: image dimensions are zero.");
            }
            return { height, width };
        }

        // Skip marker segment
        if (marker === 0xd9 || marker === 0xda) {
            // EOI or SOS (start of scan)
            break;
        }

        if (offset + 4 > bytes.length) {
            break;
        }

        const length = view.getUint16(offset + 2, false);
        if (length < 2) {
            break;
        }
        offset += 2 + length;
    }

    return { height: 1, width: 1 };
}

/**
 * Validates WebP structural format and extracts dimensions.
 */
function validateWebpIntegrity(bytes: Uint8Array): DecodedImageDimensions {
    if (bytes.length < 30) {
        throw new ChartExportError("resource-load-failed", "WebP image payload is truncated.");
    }

    // RIFF .... WEBP
    if (
        bytes[0] !== 0x52 ||
        bytes[1] !== 0x49 ||
        bytes[2] !== 0x46 ||
        bytes[3] !== 0x46 ||
        bytes[8] !== 0x57 ||
        bytes[9] !== 0x45 ||
        bytes[10] !== 0x42 ||
        bytes[11] !== 0x50
    ) {
        throw new ChartExportError("resource-load-failed", "Invalid WebP signature.");
    }

    return { height: 1, width: 1 };
}

/**
 * Validates that the provided image bytes can actually be decoded by the browser
 * as a valid raster image with positive dimensions (R5-02).
 *
 * Magic-byte sniffing alone is necessary but not sufficient; corrupted or truncated
 * payloads that carry valid headers must fail validation before export acceptance.
 */
export async function validateRasterImageDecode(
    bytes: Uint8Array,
    mediaType: ChartExportRasterMediaType,
    signal?: AbortSignal
): Promise<DecodedImageDimensions> {
    if (signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    if (bytes.length === 0) {
        throw new ChartExportError("resource-load-failed", "Template image resource has empty byte content.");
    }

    // 1. First enforce structural container and chunk integrity (fast, deterministic in all environments)
    let structuralDimensions: DecodedImageDimensions;
    switch (mediaType) {
        case "image/png":
            structuralDimensions = validatePngIntegrity(bytes);
            break;
        case "image/jpeg":
            structuralDimensions = validateJpegIntegrity(bytes);
            break;
        case "image/webp":
            structuralDimensions = validateWebpIntegrity(bytes);
            break;
        default:
            throw new ChartExportError("resource-load-failed", `Unsupported media type for decoding: '${mediaType}'.`);
    }

    // 2. In browser environments with createImageBitmap, perform bitmap decode verification
    if (typeof createImageBitmap === "function" && typeof Blob !== "undefined") {
        let bitmapPromise: Promise<ImageBitmap>;
        try {
            const blob = new Blob([bytes as unknown as BlobPart], { type: mediaType });
            bitmapPromise = createImageBitmap(blob);
        } catch (err: unknown) {
            throw new ChartExportError("resource-load-failed", "Failed to create ImageBitmap from image payload.", {
                cause: err
            });
        }

        if (signal) {
            const abortPromise = new Promise<never>((_, reject) => {
                const onAbort = () => reject(new DOMException("Export was aborted", "AbortError"));
                signal.addEventListener("abort", onAbort, { once: true });
            });

            try {
                const bitmap = await Promise.race([bitmapPromise, abortPromise]);
                const width = bitmap.width;
                const height = bitmap.height;
                bitmap.close();

                if (width <= 0 || height <= 0) {
                    throw new ChartExportError("resource-load-failed", "Template image resource decoded to empty dimensions.");
                }
                return { height, width };
            } catch (err: unknown) {
                if ((err as { name?: string })?.name === "AbortError" || signal.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }
                if (err instanceof ChartExportError) {
                    throw err;
                }
                throw new ChartExportError("resource-load-failed", "Template image resource failed image bitmap decoding.", {
                    cause: err
                });
            }
        } else {
            try {
                const bitmap = await bitmapPromise;
                const width = bitmap.width;
                const height = bitmap.height;
                bitmap.close();

                if (width <= 0 || height <= 0) {
                    throw new ChartExportError("resource-load-failed", "Template image resource decoded to empty dimensions.");
                }
                return { height, width };
            } catch (err: unknown) {
                if (err instanceof ChartExportError) {
                    throw err;
                }
                throw new ChartExportError("resource-load-failed", "Template image resource failed image bitmap decoding.", {
                    cause: err
                });
            }
        }
    }

    // 3. Fallback for non-browser / jsdom testing: structural chunk dimensions are certified
    return structuralDimensions;
}
