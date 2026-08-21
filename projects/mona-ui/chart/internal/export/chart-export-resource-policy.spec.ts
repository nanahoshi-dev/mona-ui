import { describe, expect, it } from "vitest";
import {
    MAX_EXPORT_RESOURCE_BYTES,
    MAX_EXPORT_RESOURCE_DIMENSION,
    assertResourcePixelBudget,
    bytesToBase64,
    containsCssUrl,
    decodeDataUrlPayload,
    decodeBase64Payload,
    extractCssUrls,
    isSupportedRasterMediaType,
    parseDataUri,
    parseDataUrlMediaType,
    sniffRasterImageType
} from "./chart-export-resource-policy";
import { ChartExportError } from "../../models/chart-export.models";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

describe("chart-export-resource-policy", () => {
    // -------------------------------------------------------------------------
    // Data URI parsing (R6-07 §26.1)
    // -------------------------------------------------------------------------
    describe("parseDataUri", () => {
        it("parses exact media type, base64 marker, and raw payload", () => {
            const parsed = parseDataUri("DATA:Image/PNG;base64,iVBORw0KGgo=");
            expect(parsed).not.toBeNull();
            expect(parsed!.mediaType).toBe("image/png");
            expect(parsed!.isBase64).toBe(true);
            // Payload must stay byte-faithful (case-sensitive base64)
            expect(parsed!.payload).toBe("iVBORw0KGgo=");
        });

        it("detects non-base64 payloads", () => {
            const parsed = parseDataUri("data:image/png,%89%50");
            expect(parsed!.isBase64).toBe(false);
            expect(parsed!.payload).toBe("%89%50");
        });

        it("returns null for non-data URIs and malformed headers", () => {
            expect(parseDataUri("https://example.com/x.png")).toBeNull();
            expect(parseDataUri("data:no-comma")).toBeNull();
        });
    });

    it("keeps parseDataUrlMediaType compatible and case-insensitive", () => {
        expect(parseDataUrlMediaType("data:image/png;base64,AAA")).toBe("image/png");
        expect(parseDataUrlMediaType("data:IMAGE/WEBP;base64,AAA")).toBe("image/webp");
        expect(parseDataUrlMediaType("not-a-data-uri")).toBeNull();
    });

    // -------------------------------------------------------------------------
    // Encoding policy (R6-08 Option B): base64-only raster data URIs
    // -------------------------------------------------------------------------
    describe("decodeDataUrlPayload encoding policy", () => {
        it("decodes valid base64 raster data URIs to exact bytes", () => {
            const url = `data:image/png;base64,${btoa(String.fromCharCode(...ONE_PX_PNG_BYTES))}`;
            const { bytes, mediaType } = decodeDataUrlPayload(url);
            expect(mediaType).toBe("image/png");
            expect(bytes).toEqual(ONE_PX_PNG_BYTES);
        });

        it("rejects percent-encoded binary payloads explicitly", () => {
            expect(() =>
                decodeDataUrlPayload("data:image/png,%89%50%4E%47%0D%0A%1A%0A")
            ).toThrowError(/base64/);
        });

        it("rejects malformed base64 payloads", () => {
            expect(() => decodeDataUrlPayload("data:image/png;base64,!!!NotBase64!!!")).toThrowError(
                ChartExportError
            );
        });

        it("rejects oversized payloads before materializing decoded bytes", () => {
            const oversizedPayload = "A".repeat(Math.ceil((MAX_EXPORT_RESOURCE_BYTES * 4) / 3) + 8);
            expect(() => decodeDataUrlPayload(`data:image/png;base64,${oversizedPayload}`)).toThrowError(
                ChartExportError
            );
        });
    });

    it("decodes strict base64 payload strings with a context label on failure", () => {
        expect(Array.from(decodeBase64Payload(btoa("hi"), "test"))).toEqual([104, 105]);
        expect(() => decodeBase64Payload("@@@@", "test context")).toThrowError(/test context/);
    });

    // -------------------------------------------------------------------------
    // Shared case-insensitive CSS URL grammar (R6-01 §6.6 / R6-07 §12.5 / INV-03)
    // -------------------------------------------------------------------------
    describe("case-insensitive css url discovery", () => {
        it("detects every producer casing of the url function", () => {
            expect(containsCssUrl("url(#a)")).toBe(true);
            expect(containsCssUrl("URL(#a)")).toBe(true);
            expect(containsCssUrl("Url(#a)")).toBe(true);
            expect(containsCssUrl("uRl (#a)")).toBe(true);
            expect(containsCssUrl("none")).toBe(false);
            expect(containsCssUrl("")).toBe(false);
            expect(containsCssUrl(null)).toBe(false);
        });

        it("extracts unquoted, single-quoted, and double-quoted urls case-insensitively", () => {
            expect(extractCssUrls("background-image:URL(a.png)")).toEqual(["a.png"]);
            expect(extractCssUrls("list-style-image:url('b.png') other")).toEqual(["b.png"]);
            expect(extractCssUrls('mask:url("c.png")')).toEqual(["c.png"]);
            expect(extractCssUrls("fill:url(#g1) stroke:url(#g2)")).toEqual(["#g1", "#g2"]);
            expect(extractCssUrls("no tokens here")).toEqual([]);
        });
    });

    // -------------------------------------------------------------------------
    // Magic-byte sniffing
    // -------------------------------------------------------------------------
    describe("sniffRasterImageType", () => {
        it("identifies PNG, JPEG, and WebP magic bytes exactly", () => {
            expect(sniffRasterImageType(ONE_PX_PNG_BYTES)).toBe("image/png");
            expect(sniffRasterImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
            expect(sniffRasterImageType(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
            expect(sniffRasterImageType(new Uint8Array([1, 2, 3]))).toBeNull();
        });

        it("supports the exact first-release media allowlist only", () => {
            expect(isSupportedRasterMediaType("image/png")).toBe(true);
            expect(isSupportedRasterMediaType("IMAGE/JPEG")).toBe(true);
            expect(isSupportedRasterMediaType("image/webp")).toBe(true);
            expect(isSupportedRasterMediaType("image/gif")).toBe(false);
            expect(isSupportedRasterMediaType("image/svg+xml")).toBe(false);
            expect(isSupportedRasterMediaType(null)).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Decoded pixel budget (R6-06 §11.5)
    // -------------------------------------------------------------------------
    describe("assertResourcePixelBudget", () => {
        it("accepts dimensions within the budget", () => {
            expect(() => assertResourcePixelBudget(MAX_EXPORT_RESOURCE_DIMENSION, 1, "png")).not.toThrow();
            expect(() => assertResourcePixelBudget(4096, 4096, "png")).not.toThrow();
        });

        it("rejects invalid or empty dimensions", () => {
            expect(() => assertResourcePixelBudget(0, 10, "png")).toThrowError(ChartExportError);
            expect(() => assertResourcePixelBudget(-5, 10, "png")).toThrowError(ChartExportError);
            expect(() => assertResourcePixelBudget(Number.NaN, 10, "png")).toThrowError(ChartExportError);
        });

        it("rejects edge lengths beyond the dimension cap", () => {
            expect(() => assertResourcePixelBudget(MAX_EXPORT_RESOURCE_DIMENSION + 1, 1, "png")).toThrowError(
                ChartExportError
            );
        });

        it("rejects pixel counts beyond the pixel budget", () => {
            expect(() => assertResourcePixelBudget(20000, 20000, "webp")).toThrowError(ChartExportError);
        });
    });

    it("round-trips bytes through base64", () => {
        const roundTrip = atob(bytesToBase64(ONE_PX_PNG_BYTES));
        const decoded = Uint8Array.from(roundTrip, c => c.charCodeAt(0));
        expect(decoded).toEqual(ONE_PX_PNG_BYTES);
    });
});
