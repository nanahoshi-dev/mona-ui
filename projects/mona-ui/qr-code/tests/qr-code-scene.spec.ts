import { describe, expect, it } from "vitest";
import { qrCodeFileName } from "../internal/qr-code-download";
import { renderQrCodeSvg } from "../internal/qr-code-export";
import { buildQrCodeScene, polygonPath } from "../internal/qr-code-scene";
import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";
import { encodeQrCode } from "../utils/qr-code-encoder";
import type { QrCodeMatrix } from "../utils/qr-code-matrix";

const URL_VALUE = "https://nanahoshi.dev/mona-ui/components/qr-code";
const BLACK = { a: 255, b: 0, g: 0, r: 0 };
const WHITE = { a: 255, b: 255, g: 255, r: 255 };
const TRANSPARENT = { a: 0, b: 0, g: 0, r: 0 };

function matrixFor(value: string, errorCorrection: QrCodeErrorCorrection = "M"): QrCodeMatrix {
    const matrix = encodeQrCode(value, { encoding: "utf-8", errorCorrection }).matrix;
    if (!matrix) {
        throw new Error("Expected the value to encode");
    }
    return matrix;
}

describe("buildQrCodeScene", () => {
    it("adds the quiet zone around the symbol", () => {
        const matrix = matrixFor("Mona UI");
        expect(buildQrCodeScene(matrix, 4, null).size).toBe(matrix.size + 8);
        expect(buildQrCodeScene(matrix, 0, null).size).toBe(matrix.size);
    });

    it("draws each horizontal run of dark modules as one rectangle, offset by the quiet zone", () => {
        const matrix = matrixFor("Mona UI");
        const scene = buildQrCodeScene(matrix, 4, null);
        // The top row starts with the top-left finder's 7 dark modules.
        expect(scene.modulesPath.startsWith("M4 4h7v1h-7z")).toBe(true);
        let runs = 0;
        for (let y = 0; y < matrix.size; y++) {
            for (let x = 0; x < matrix.size; x++) {
                const dark = matrix.modules[y * matrix.size + x] === 1;
                const previousDark = x > 0 && matrix.modules[y * matrix.size + x - 1] === 1;
                if (dark && !previousDark) {
                    runs++;
                }
            }
        }
        expect(scene.modulesPath.match(/M/g)?.length).toBe(runs);
    });

    it("clears an odd, centered square of whole modules behind an image", () => {
        const matrix = matrixFor(URL_VALUE, "H");
        const scene = buildQrCodeScene(matrix, 4, { size: 0.2, src: "logo.svg", type: "image" });
        const overlay = scene.overlay;
        expect(overlay?.kind).toBe("image");
        if (overlay?.kind !== "image") {
            return;
        }
        expect(overlay.clear.size % 2).toBe(1);
        expect(overlay.clear.x - 4).toBe((matrix.size - overlay.clear.size) / 2);
        expect(overlay.box.size).toBeCloseTo(matrix.size * 0.2);
        // Half a module of clearing at least on each side.
        expect(overlay.clear.size - overlay.box.size).toBeGreaterThanOrEqual(1);
        expect(overlay.src).toBe("logo.svg");

        const start = overlay.clear.x - 4;
        for (let y = 0; y < matrix.size; y++) {
            for (let x = 0; x < matrix.size; x++) {
                const inside =
                    x >= start && x < start + overlay.clear.size && y >= start && y < start + overlay.clear.size;
                const index = y * matrix.size + x;
                expect(scene.modules[index]).toBe(inside ? 0 : matrix.modules[index]);
            }
        }
    });

    it("keeps the cleared square off the finder patterns and the format information", () => {
        const matrix = matrixFor("1", "H");
        const scene = buildQrCodeScene(matrix, 4, { size: 1, src: "logo.svg", type: "image" });
        expect(matrix.size).toBe(21);
        expect(scene.overlay?.clear.size).toBe(3);
        expect(scene.overlay?.box.size).toBe(2);
    });

    it("falls back to a fifth of the code for a size that isn't a positive number", () => {
        const matrix = matrixFor(URL_VALUE, "H");
        for (const size of [undefined, 0, -1, Number.NaN]) {
            const scene = buildQrCodeScene(matrix, 4, { size, src: "logo.svg", type: "image" });
            expect(scene.overlay?.box.size).toBeCloseTo(matrix.size * 0.2);
        }
    });

    it("draws the Swiss cross at 7/46 of the code in a light frame", () => {
        const matrix = matrixFor("SPC\n0200\n1\nCH4431999123000889012");
        const scene = buildQrCodeScene(matrix, 4, { type: "swiss" });
        const overlay = scene.overlay;
        expect(overlay?.kind).toBe("swiss");
        if (overlay?.kind !== "swiss") {
            return;
        }
        expect(overlay.box.size).toBeCloseTo((matrix.size * 7) / 46);
        expect(overlay.badge.size).toBeCloseTo((overlay.box.size * 6) / 7);
        expect(overlay.badge.x - overlay.box.x).toBeCloseTo(overlay.box.size / 14);
        expect(overlay.cross).toHaveLength(12);
        const center = overlay.box.x + overlay.box.size / 2;
        const xs = overlay.cross.map(([x]) => x);
        // The cross spans 20/32 of the badge, centered.
        expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo((overlay.badge.size * 20) / 32);
        expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(center);
        expect(scene.overlayExceedsCorrection).toBe(false);
    });

    it("flags an overlay that hides more than error correction recovers", () => {
        const overlay = { size: 0.3, src: "logo.svg", type: "image" } as const;
        expect(buildQrCodeScene(matrixFor(URL_VALUE, "L"), 4, overlay).overlayExceedsCorrection).toBe(true);
        expect(buildQrCodeScene(matrixFor(URL_VALUE, "H"), 4, overlay).overlayExceedsCorrection).toBe(false);
        expect(buildQrCodeScene(matrixFor(URL_VALUE, "L"), 4, null).overlayExceedsCorrection).toBe(false);
    });
});

describe("renderQrCodeSvg", () => {
    const scene = buildQrCodeScene(matrixFor("Mona UI"), 4, null);

    it("writes a standalone document with its size, view box and title", () => {
        const svg = renderQrCodeSvg(scene, {
            background: WHITE,
            foreground: BLACK,
            imageHref: null,
            label: `Tickets & "VIP" <entry>`,
            size: 300
        });
        expect(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"`)).toBe(true);
        expect(svg).toContain(`viewBox="0 0 ${scene.size} ${scene.size}"`);
        expect(svg).toContain("<title>Tickets &#38; &#34;VIP&#34; &#60;entry&#62;</title>");
        expect(svg).toContain(`<rect width="${scene.size}" height="${scene.size}" fill="#ffffff"/>`);
        expect(svg).toContain(`<path d="${scene.modulesPath}" fill="#000000"/>`);
        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(parsed.querySelector("parsererror")).toBeNull();
    });

    it("leaves a transparent background out and writes partial opacity", () => {
        const svg = renderQrCodeSvg(scene, {
            background: TRANSPARENT,
            foreground: { a: 128, b: 64, g: 32, r: 16 },
            imageHref: null,
            label: "QR code",
            size: 100
        });
        expect(svg).not.toContain("<rect");
        expect(svg).toContain(`fill="#102040" fill-opacity="0.502"`);
    });

    it("draws the Swiss cross and embeds an image overlay", () => {
        const matrix = matrixFor(URL_VALUE, "H");
        const swiss = buildQrCodeScene(matrix, 4, { type: "swiss" });
        const swissSvg = renderQrCodeSvg(swiss, {
            background: WHITE,
            foreground: BLACK,
            imageHref: null,
            label: "QR code",
            size: 100
        });
        if (swiss.overlay?.kind === "swiss") {
            expect(swissSvg).toContain(`<path d="${polygonPath(swiss.overlay.cross)}" fill="#ffffff"/>`);
        }
        expect(swissSvg.match(/<rect/g)).toHaveLength(3);

        const image = buildQrCodeScene(matrix, 4, { src: "logo.png", type: "image" });
        const imageSvg = renderQrCodeSvg(image, {
            background: WHITE,
            foreground: BLACK,
            imageHref: "data:image/png;base64,AAAA",
            label: "QR code",
            size: 100
        });
        expect(imageSvg).toContain(`<image href="data:image/png;base64,AAAA"`);
        expect(imageSvg).toContain(`preserveAspectRatio="xMidYMid meet"`);
    });
});

describe("qrCodeFileName", () => {
    it("adds the format's extension once", () => {
        expect(qrCodeFileName(undefined, "png")).toBe("qr-code.png");
        expect(qrCodeFileName("ticket", "svg")).toBe("ticket.svg");
        expect(qrCodeFileName("ticket.PDF", "pdf")).toBe("ticket.pdf");
        expect(qrCodeFileName("ticket.png", "svg")).toBe("ticket.png.svg");
    });

    it("replaces reserved characters and trims dots and spaces", () => {
        expect(qrCodeFileName("a/b:c*?", "png")).toBe("a_b_c__.png");
        expect(qrCodeFileName("  ..hidden. ", "png")).toBe("hidden.png");
        expect(qrCodeFileName(" . ", "png")).toBe("qr-code.png");
    });
});
