import { ChartExportError } from "../../models/chart-export.models";
import {
    ChartExportRasterMediaType,
    assertResourcePixelBudget,
    sniffRasterImageType
} from "./chart-export-resource-policy";

export interface DecodedImageDimensions {
    readonly height: number;
    readonly width: number;
}

/**
 * Internal decode-capability seam. Production resolution derives every field from
 * platform globals; tests may inject deterministic fakes for either strategy
 * without touching global mutable state (R6-03 / R6-05).
 */
export interface RasterDecodeEnvironment {
    readonly createHtmlImage?: (() => HTMLImageElement) | undefined;
    readonly createImageBitmap?: typeof createImageBitmap | undefined;
    readonly createObjectURL?: ((blob: Blob) => string) | undefined;
    readonly revokeObjectURL?: ((url: string) => void) | undefined;
}

interface ResolvedDecodeEnvironment {
    readonly bitmapDecode: typeof createImageBitmap | undefined;
    readonly htmlImageDecode:
        | {
              readonly createHtmlImage: () => HTMLImageElement;
              readonly createObjectURL: (blob: Blob) => string;
              readonly revokeObjectURL: (url: string) => void;
          }
        | undefined;
}

function resolveEnvironment(overrides?: RasterDecodeEnvironment): ResolvedDecodeEnvironment {
    const bitmapDecode =
        overrides && "createImageBitmap" in overrides
            ? overrides.createImageBitmap
            : typeof createImageBitmap === "function"
                ? createImageBitmap
                : undefined;

    const globalCreateObjectURL = typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL.bind(URL)
        : undefined;
    const globalRevokeObjectURL = typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function"
        ? URL.revokeObjectURL.bind(URL)
        : undefined;

    // The object-URL image strategy requires a real image decoding stack: an Image
    // constructor, object URLs, and HTMLImageElement.decode. Environments without a
    // decode-capable Image (e.g. jsdom) fail closed to "no decoder available"
    // instead of staging loads that can never complete.
    const hasDecodeCapableImage =
        typeof Image === "function" && typeof Image.prototype?.decode === "function";

    const createHtmlImage =
        overrides?.createHtmlImage ??
        (hasDecodeCapableImage ? () => new Image() : undefined);
    const createObjectURL = overrides?.createObjectURL ?? globalCreateObjectURL;
    const revokeObjectURL = overrides?.revokeObjectURL ?? globalRevokeObjectURL;

    const htmlImageDecode =
        createHtmlImage && createObjectURL && revokeObjectURL
            ? { createHtmlImage, createObjectURL, revokeObjectURL }
            : undefined;

    return { bitmapDecode, htmlImageDecode };
}

/**
 * Validates PNG structural chunks and extracts dimensions (IHDR chunk).
 */
function parsePngDimensions(bytes: Uint8Array): DecodedImageDimensions {
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
 * Returns null when no supported SOF marker exists; a real browser decoder must
 * then decide admission. Synthetic dimensions are never fabricated (R6-03).
 */
function parseJpegDimensions(bytes: Uint8Array): DecodedImageDimensions | null {
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
            // EOI or SOS (start of scan) reached without a supported SOF marker
            return null;
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

    return null;
}

/**
 * Validates the WebP container and extracts dimensions from the VP8 / VP8L / VP8X
 * bitstream chunk when parsable. Returns null when the chunk kind is unrecognized
 * or its header cannot be trusted; a real browser decoder must then decide
 * admission. Synthetic dimensions are never fabricated (R6-03).
 */
function parseWebpDimensions(bytes: Uint8Array): DecodedImageDimensions | null {
    if (bytes.length < 20) {
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

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const chunkFourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    const view2 = (offset: number): number => view.getUint16(offset, true);

    if (chunkFourcc === "VP8 ") {
        // Lossy bitstream: frame tag (3 bytes), sync code (0x9D 0x01 0x2A), then LE dimensions.
        if (bytes.length < 30 || bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
            return null;
        }
        const width = view2(26) & 0x3fff;
        const height = view2(28) & 0x3fff;
        return width > 0 && height > 0 ? { height, width } : null;
    }

    if (chunkFourcc === "VP8L") {
        // Lossless bitstream: signature byte 0x2F then packed 14-bit width-1 / height-1.
        if (bytes.length < 25 || bytes[20] !== 0x2f) {
            return null;
        }
        const b0 = bytes[21];
        const b1 = bytes[22];
        const b2 = bytes[23];
        const b3 = bytes[24];
        const width = 1 + (((b1 & 0x3f) << 8 | b0) & 0x3fff);
        const height = 1 + (((b3 << 10 | b2 << 2 | b1 >> 6)) & 0x3fff);
        return width > 0 && height > 0 ? { height, width } : null;
    }

    if (chunkFourcc === "VP8X") {
        // Extended format: 4 reserved bytes then 24-bit LE canvas width-1 / height-1.
        if (bytes.length < 30) {
            return null;
        }
        const width = 1 + (bytes[24] | bytes[25] << 8 | bytes[26] << 16);
        const height = 1 + (bytes[27] | bytes[28] << 8 | bytes[29] << 16);
        return width > 0 && height > 0 ? { height, width } : null;
    }

    return null;
}

/**
 * Fast structural gate: verifies magic/container integrity and extracts trustworthy
 * dimensions when possible. Returns null for containers whose pixel dimensions can
 * only be determined by a real browser decoder. Structural parsing is never the
 * final admission criterion (R6-03 / INV-02).
 */
export function getStructuralImageDimensions(
    bytes: Uint8Array,
    mediaType: ChartExportRasterMediaType
): DecodedImageDimensions | null {
    switch (mediaType) {
        case "image/png":
            return parsePngDimensions(bytes);
        case "image/jpeg":
            return parseJpegDimensions(bytes);
        case "image/webp":
            return parseWebpDimensions(bytes);
        default:
            throw new ChartExportError("resource-load-failed", `Unsupported media type for decoding: '${mediaType}'.`);
    }
}

function abortError(): DOMException {
    return new DOMException("Export was aborted", "AbortError");
}

/**
 * Races a bitmap decode against abort with deterministic lifecycle cleanup (R6-05):
 * the abort listener is removed on every completion path and a bitmap that resolves
 * after a public abort is closed exactly once instead of leaking.
 */
function decodeBitmapAbortably(
    blob: Blob,
    bitmapDecode: typeof createImageBitmap,
    signal?: AbortSignal
): Promise<ImageBitmap> {
    return new Promise<ImageBitmap>((resolve, reject) => {
        let settled = false;
        let aborted = false;

        const removeAbortListener = () => {
            signal?.removeEventListener("abort", onAbort);
        };

        const settle = (run: () => void) => {
            if (settled) {
                return;
            }
            settled = true;
            try {
                run();
            } catch (err: unknown) {
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        };

        const onAbort = () => {
            aborted = true;
            removeAbortListener();
            settle(() => reject(abortError()));
        };

        signal?.addEventListener("abort", onAbort, { once: true });

        bitmapDecode(blob).then(
            bitmap => {
                removeAbortListener();
                if (aborted || signal?.aborted) {
                    bitmap.close();
                    return;
                }
                settle(() => resolve(bitmap));
            },
            (error: unknown) => {
                removeAbortListener();
                settle(() => reject(error));
            }
        );
    });
}

/**
 * HTMLImageElement decode fallback via an export-owned object URL (R6-03).
 * The original external URL is never used for decoding. Object URL revocation,
 * listener cleanup, and late-completion discards after abort are deterministic.
 */
function decodeWithHtmlImage(
    bytes: Uint8Array,
    mediaType: ChartExportRasterMediaType,
    env: NonNullable<ResolvedDecodeEnvironment["htmlImageDecode"]>,
    signal?: AbortSignal
): Promise<DecodedImageDimensions> {
    return new Promise<DecodedImageDimensions>((resolve, reject) => {
        let settled = false;
        let aborted = false;
        let objectUrl: string | null = null;

        const img = env.createHtmlImage();

        const revokeObjectUrl = () => {
            if (objectUrl !== null) {
                env.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };

        const cleanupListeners = () => {
            img.onload = null;
            img.onerror = null;
            signal?.removeEventListener("abort", onAbort);
        };

        const finishOk = (dimensions: DecodedImageDimensions) => {
            if (settled || aborted || signal?.aborted) {
                return;
            }
            settled = true;
            cleanupListeners();
            revokeObjectUrl();
            resolve(dimensions);
        };

        const finishErr = (error: unknown) => {
            if (settled || aborted) {
                return;
            }
            settled = true;
            cleanupListeners();
            revokeObjectUrl();
            reject(error);
        };

        const onAbort = () => {
            if (settled) {
                return;
            }
            aborted = true;
            settled = true;
            cleanupListeners();
            revokeObjectUrl();
            reject(abortError());
        };

        signal?.addEventListener("abort", onAbort, { once: true });

        try {
            const blob = new Blob([bytes as unknown as BlobPart], { type: mediaType });
            objectUrl = env.createObjectURL(blob);
            img.onload = () => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                finishOk({ height, width });
            };
            img.onerror = e => {
                finishErr(
                    new ChartExportError("resource-load-failed", "Template image resource failed image element decoding.", {
                        cause: e
                    })
                );
            };
            img.src = objectUrl;
        } catch (err: unknown) {
            settled = true;
            cleanupListeners();
            revokeObjectUrl();
            reject(
                new ChartExportError("resource-load-failed", "Failed to stage image element decoding.", { cause: err })
            );
        }
    });
}

/**
 * Validates that the provided image bytes actually decode in the current browser
 * as a valid raster image with positive, budget-safe dimensions (R5-02 / R6-03).
 *
 * Admission policy (INV-02):
 * - structural parsing only gates fast-rejection and dimension extraction;
 * - acceptance requires a real decode via createImageBitmap when available,
 *   otherwise via an export-owned object URL + HTMLImageElement decode;
 * - environments with neither capability fail explicitly instead of trusting headers.
 *
 * When structural dimensions are known they must match decoded dimensions (R6-03 §23.6).
 */
export async function validateRasterImageDecode(
    bytes: Uint8Array,
    mediaType: ChartExportRasterMediaType,
    signal?: AbortSignal,
    environment?: RasterDecodeEnvironment
): Promise<DecodedImageDimensions> {
    if (signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    if (bytes.length === 0) {
        throw new ChartExportError("resource-load-failed", "Template image resource has empty byte content.");
    }

    const sniffed = sniffRasterImageType(bytes);
    if (!sniffed || sniffed !== mediaType) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template image resource bytes do not match ${mediaType} image format.`
        );
    }

    // 1. Structural container integrity and trustworthy early dimensions.
    const structuralDimensions = getStructuralImageDimensions(bytes, mediaType);

    if (structuralDimensions) {
        assertResourcePixelBudget(structuralDimensions.width, structuralDimensions.height, mediaType);
    }

    // 2. Select the decode strategy.
    const env = resolveEnvironment(environment);

    let decoded: DecodedImageDimensions;
    if (env.bitmapDecode) {
        let blob: Blob;
        try {
            blob = new Blob([bytes as unknown as BlobPart], { type: mediaType });
        } catch (err: unknown) {
            throw new ChartExportError("resource-load-failed", "Failed to create ImageBitmap from image payload.", {
                cause: err
            });
        }
        try {
            const bitmap = await decodeBitmapAbortably(blob, env.bitmapDecode, signal);
            decoded = { height: bitmap.height, width: bitmap.width };
            bitmap.close();
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === "AbortError" || signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }
            if (err instanceof ChartExportError) {
                throw err;
            }
            throw new ChartExportError("resource-load-failed", "Template image resource failed image bitmap decoding.", {
                cause: err
            });
        }
    } else if (env.htmlImageDecode) {
        try {
            decoded = await decodeWithHtmlImage(bytes, mediaType, env.htmlImageDecode, signal);
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === "AbortError" || signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }
            if (err instanceof ChartExportError) {
                throw err;
            }
            throw new ChartExportError("resource-load-failed", "Template image resource failed image element decoding.", {
                cause: err
            });
        }
    } else {
        throw new ChartExportError(
            "unsupported-environment",
            "No raster image decoder is available in this environment; template images cannot be certified."
        );
    }

    // 3. Decoded dimensions must satisfy the safety budget and match known structure.
    assertResourcePixelBudget(decoded.width, decoded.height, mediaType);

    if (
        structuralDimensions &&
        (structuralDimensions.width !== decoded.width || structuralDimensions.height !== decoded.height)
    ) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template image resource is inconsistent: structural dimensions ` +
                `${structuralDimensions.width}x${structuralDimensions.height} do not match decoded dimensions ` +
                `${decoded.width}x${decoded.height}.`
        );
    }

    return decoded;
}
