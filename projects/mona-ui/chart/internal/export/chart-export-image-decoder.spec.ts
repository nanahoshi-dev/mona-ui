// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
    getStructuralImageDimensions,
    RasterDecodeEnvironment,
    validateRasterImageDecode
} from "./chart-export-image-decoder";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

/** Minimal valid 1x1 JPEG (baseline grayscale, 8x8 quantization-free minimal structure). */
const ONE_PX_JPEG_BYTES = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11,
    0x01, 0xff, 0xd9
]);

/** Minimal valid VP8L (lossless) WebP container: 1x1 dimensions. */
function buildVp8lWebpBytes(width: number, height: number): Uint8Array {
    const bytes = new Uint8Array(30);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    const riffSize = 21;
    bytes[4] = riffSize & 0xff;
    bytes[5] = (riffSize >> 8) & 0xff;
    bytes[6] = (riffSize >> 16) & 0xff;
    bytes[7] = (riffSize >> 24) & 0xff;
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
    bytes.set([0x56, 0x50, 0x38, 0x4c], 12); // "VP8L"
    const chunkSize = 5;
    bytes[16] = chunkSize;
    bytes[20] = 0x2f; // VP8L signature
    const w = width - 1;
    const h = height - 1;
    bytes[21] = w & 0xff;
    bytes[22] = ((w >> 8) & 0x3f) | ((h & 0x3f) << 6);
    bytes[23] = (h >> 2) & 0xff;
    bytes[24] = (h >> 10) & 0x0f;
    return bytes;
}

function corruptPngWithValidHeader(): Uint8Array {
    return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
}

interface DeferredImageBitmap {
    promise: Promise<ImageBitmap>;
    reject: (err: unknown) => void;
    resolve: (bitmap: ImageBitmap) => void;
}

function deferredBitmap(): DeferredImageBitmap {
    let resolve!: (bitmap: ImageBitmap) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<ImageBitmap>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function trackingSignal() {
    const listeners = new Set<() => void>();
    return {
        aborted: false,
        addEventListener: (_type: string, listener: () => void) => {
            listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: () => void) => {
            listeners.delete(listener);
        },
        fire(): void {
            this.aborted = true;
            for (const listener of Array.from(listeners)) {
                listener();
            }
        },
        get listenerCount(): number {
            return listeners.size;
        }
    };
}

describe("chart-export-image-decoder", () => {
    // -------------------------------------------------------------------------
    // Structural parsing (fast gate, never the final admission criterion)
    // -------------------------------------------------------------------------
    describe("structural dimension parsing", () => {
        it("extracts exact PNG IHDR dimensions", () => {
            expect(getStructuralImageDimensions(ONE_PX_PNG_BYTES, "image/png")).toEqual({ height: 1, width: 1 });
        });

        it("extracts JPEG SOF dimensions", () => {
            expect(getStructuralImageDimensions(ONE_PX_JPEG_BYTES, "image/jpeg")).toEqual({ height: 1, width: 1 });
        });

        it("returns null instead of synthetic dimensions for JPEG payloads without a supported SOF marker", () => {
            const jpegSoiOnly = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34]);
            expect(getStructuralImageDimensions(jpegSoiOnly, "image/jpeg")).toBeNull();
        });

        it("throws on truncated JPEG SOF markers", () => {
            const truncatedSof = Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0x00]);
            expect(() => getStructuralImageDimensions(truncatedSof, "image/jpeg")).toThrowError(ChartExportError);
        });

        it("parses VP8L lossless WebP dimensions", () => {
            const webp = buildVp8lWebpBytes(37, 23);
            expect(getStructuralImageDimensions(webp, "image/webp")).toEqual({ height: 23, width: 37 });
        });

        it("returns null instead of synthetic dimensions for WebP payloads without a parsable bitstream chunk", () => {
            const webpPrefixOnly = Uint8Array.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x58, 0x59, 0x5a, 0x5b, 0x5c,
                0x5d, 0x5e, 0x5f, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
            ]);
            expect(getStructuralImageDimensions(webpPrefixOnly, "image/webp")).toBeNull();
        });

        it("throws on non-image bytes for every supported media type", () => {
            expect(() => getStructuralImageDimensions(new Uint8Array([1, 2, 3, 4]), "image/png")).toThrowError(
                ChartExportError
            );
            expect(() => getStructuralImageDimensions(new Uint8Array([1, 2, 3, 4]), "image/jpeg")).toThrowError(
                ChartExportError
            );
            expect(() => getStructuralImageDimensions(new Uint8Array([1, 2, 3, 4]), "image/webp")).toThrowError(
                ChartExportError
            );
        });
    });

    // -------------------------------------------------------------------------
    // Decode strategy selection and admission (INV-02)
    // -------------------------------------------------------------------------
    describe("decode admission with bitmap strategy", () => {
        function bitmapEnv(options?: { dimensions?: { width: number; height: number } }): RasterDecodeEnvironment {
            const decode = async (blob: Blob): Promise<ImageBitmap> => {
                const bytes = new Uint8Array(await blob.arrayBuffer());
                const dims = getStructuralImageDimensions(bytes, blob.type as ChartExportRasterMediaType);
                if (!dims) {
                    throw new Error("Fake browser decoder rejected the payload.");
                }
                const size = options?.dimensions ?? dims;
                return { width: size.width, height: size.height, close: () => undefined } as ImageBitmap;
            };
            return { createImageBitmap: decode as unknown as typeof createImageBitmap };
        }

        it("accepts valid PNG, JPEG, and WebP payloads", async () => {
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, bitmapEnv())
            ).resolves.toEqual({ height: 1, width: 1 });
            await expect(
                validateRasterImageDecode(ONE_PX_JPEG_BYTES, "image/jpeg", undefined, bitmapEnv())
            ).resolves.toEqual({ height: 1, width: 1 });
            await expect(
                validateRasterImageDecode(buildVp8lWebpBytes(5, 7), "image/webp", undefined, bitmapEnv())
            ).resolves.toEqual({ height: 7, width: 5 });
        });

        it("rejects corrupt PNG payloads carrying a valid header", async () => {
            await expect(
                validateRasterImageDecode(corruptPngWithValidHeader(), "image/png", undefined, bitmapEnv())
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects malformed JPEG payloads carrying only the SOI prefix", async () => {
            const jpegSoiOnly = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34]);
            await expect(
                validateRasterImageDecode(jpegSoiOnly, "image/jpeg", undefined, bitmapEnv())
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects malformed WebP payloads carrying only the RIFF/WEBP prefix", async () => {
            const webpPrefixOnly = Uint8Array.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x58, 0x59, 0x5a, 0x5b, 0x5c,
                0x5d, 0x5e, 0x5f, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
            ]);
            await expect(
                validateRasterImageDecode(webpPrefixOnly, "image/webp", undefined, bitmapEnv())
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects payloads whose decoded dimensions exceed the resource pixel budget", async () => {
            await expect(
                validateRasterImageDecode(
                    ONE_PX_PNG_BYTES,
                    "image/png",
                    undefined,
                    bitmapEnv({
                        dimensions: { width: 20000, height: 20000 }
                    })
                )
            ).rejects.toMatchObject({ code: "too-large" });
        });

        it("rejects payloads whose decoded dimensions contradict known structural dimensions", async () => {
            await expect(
                validateRasterImageDecode(
                    ONE_PX_PNG_BYTES,
                    "image/png",
                    undefined,
                    bitmapEnv({
                        dimensions: { width: 9, height: 9 }
                    })
                )
            ).rejects.toThrowError(/inconsistent/);
        });
    });

    describe("forced HTML image fallback strategy", () => {
        interface FakeImage {
            height: number;
            naturalHeight: number;
            naturalWidth: number;
            onerror: ((e: unknown) => void) | null;
            onload: (() => void) | null;
            src: string;
            width: number;
        }

        function htmlImageEnv(): { env: RasterDecodeEnvironment; images: FakeImage[]; revokedUrls: string[] } {
            const images: FakeImage[] = [];
            const revokedUrls: string[] = [];
            const env: RasterDecodeEnvironment = {
                createHtmlImage: () => {
                    const image: FakeImage = {
                        height: 0,
                        naturalHeight: 0,
                        naturalWidth: 0,
                        onerror: null,
                        onload: null,
                        src: "",
                        width: 0
                    };
                    images.push(image);
                    return image as unknown as HTMLImageElement;
                },
                createObjectURL: (blob: Blob) => `blob:fake/${blob.size}`,
                revokeObjectURL: (url: string) => {
                    revokedUrls.push(url);
                }
            };
            return { env, images, revokedUrls };
        }

        function settleAllImages(images: FakeImage[], succeed: boolean): void {
            for (const image of images) {
                if (succeed) {
                    image.naturalWidth = 1;
                    image.naturalHeight = 1;
                    image.width = 1;
                    image.height = 1;
                    image.onload?.();
                } else {
                    image.onerror?.(new Error("fake decode failure"));
                }
            }
        }

        it("admits valid payloads through the object-URL image path and always revokes the URL", async () => {
            const { env, images, revokedUrls } = htmlImageEnv();
            const pending = validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, env);
            settleAllImages(images, true);

            await expect(pending).resolves.toEqual({ height: 1, width: 1 });
            expect(revokedUrls.length).toBe(1);
            expect(revokedUrls[0]).toMatch(/^blob:fake\//);
        });

        it("rejects undecodable payloads and revokes the object URL", async () => {
            const { env, images, revokedUrls } = htmlImageEnv();
            // JPEG SOI-only passes the structural gate with unknown dimensions and
            // reaches the real decoder, which rejects it.
            const jpegSoiOnly = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34]);
            const pending = validateRasterImageDecode(jpegSoiOnly, "image/jpeg", undefined, env);
            settleAllImages(images, false);

            await expect(pending).rejects.toThrowError(ChartExportError);
            expect(revokedUrls.length).toBe(1);
        });
    });

    // -------------------------------------------------------------------------
    // Abort lifecycle (R6-05 / INV-09)
    // -------------------------------------------------------------------------
    describe("abort lifecycle", () => {
        it("rejects immediately when the signal is already aborted", async () => {
            const controller = new AbortController();
            controller.abort();
            const decode = vi.fn(async () => ({ width: 1, height: 1, close: () => undefined }) as ImageBitmap);

            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", controller.signal, {
                    createImageBitmap: decode as unknown as typeof createImageBitmap
                })
            ).rejects.toMatchObject({ name: "AbortError" });

            expect(decode).not.toHaveBeenCalled();
        });

        it("closes a late bitmap exactly once after abort and removes the abort listener", async () => {
            const deferred = deferredBitmap();
            const close = vi.fn();
            const signal = trackingSignal();

            const pending = validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", signal as unknown as AbortSignal, {
                createImageBitmap: (() => deferred.promise) as unknown as typeof createImageBitmap
            });

            const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
            signal.fire();
            await assertion;

            // Late bitmap resolution after the public promise already rejected
            deferred.resolve({ width: 4, height: 4, close } as unknown as ImageBitmap);
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(close).toHaveBeenCalledTimes(1);
            expect(signal.listenerCount).toBe(0);
        });

        it("removes the abort listener on successful decode and closes the bitmap after reading dimensions", async () => {
            const close = vi.fn();
            const signal = trackingSignal();

            const pending = validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", signal as unknown as AbortSignal, {
                createImageBitmap: (async () =>
                    ({ width: 1, height: 1, close }) as unknown as ImageBitmap) as unknown as typeof createImageBitmap
            });

            await expect(pending).resolves.toEqual({ height: 1, width: 1 });
            expect(close).toHaveBeenCalledTimes(1);
            expect(signal.listenerCount).toBe(0);
        });

        it("removes the abort listener when the bitmap decode rejects", async () => {
            const signal = trackingSignal();
            const decode = vi.fn(async () => {
                throw new Error("decode failure");
            });

            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", signal as unknown as AbortSignal, {
                    createImageBitmap: decode as unknown as typeof createImageBitmap
                })
            ).rejects.toThrowError(ChartExportError);

            expect(signal.listenerCount).toBe(0);
        });

        it("revokes the object URL and removes listeners when the HTML image fallback aborts", async () => {
            const signal = trackingSignal();
            const revokedUrls: string[] = [];
            const image = {
                height: 0,
                naturalHeight: 0,
                naturalWidth: 0,
                onerror: null,
                onload: null,
                src: "",
                width: 0
            };

            const pending = validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", signal as unknown as AbortSignal, {
                createHtmlImage: () => image as unknown as HTMLImageElement,
                createObjectURL: () => "blob:fake/abort",
                revokeObjectURL: (url: string) => {
                    revokedUrls.push(url);
                }
            });

            const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });

            signal.fire();
            await assertion;

            expect(revokedUrls).toEqual(["blob:fake/abort"]);
            expect(image.onload).toBeNull();
            expect(image.onerror).toBeNull();
            expect(signal.listenerCount).toBe(0);

            // A late load completion after abort must not mutate state
            const lateOnload: unknown = image.onload;
            expect(lateOnload).toBeNull();
        });

        it("does not admit any payload when no decode strategy is available", async () => {
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, {
                    createImageBitmap: undefined,
                    createHtmlImage: undefined
                })
            ).rejects.toMatchObject({ code: "unsupported-environment" });
        });
    });
});
