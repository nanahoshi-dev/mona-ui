import { afterEach, describe, expect, it, vi } from "vitest";
import { hsva2rgba } from "./hsva2rgba";
import { colorKey, formatAlpha, parseColor } from "./parseColor";
import { rgba2hsla } from "./rgba2hsla";
import { rgba2hsva } from "./rgba2hsva";

describe("parseColor", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        ["#fff", { r: 255, g: 255, b: 255, a: 255 }],
        ["#336699cc", { r: 51, g: 102, b: 153, a: 204 }],
        ["  #336699  ", { r: 51, g: 102, b: 153, a: 255 }],
        ["rgb(1, 2, 3)", { r: 1, g: 2, b: 3, a: 255 }],
        ["RGBA(1,2,3,0.5)", { r: 1, g: 2, b: 3, a: 128 }],
        ["rgba(0,0,0,1.0)", { r: 0, g: 0, b: 0, a: 255 }],
        ["rgba(0,0,0,50%)", { r: 0, g: 0, b: 0, a: 128 }],
        ["rgb(0 0 0 / 50%)", { r: 0, g: 0, b: 0, a: 128 }],
        ["rgb(100% 50% 0%)", { r: 255, g: 128, b: 0, a: 255 }],
        ["rgb(300 -5 10.4)", { r: 255, g: 0, b: 10, a: 255 }],
        ["hsl(0, 100%, 50%)", { r: 255, g: 0, b: 0, a: 255 }],
        ["hsl(210.5, 50%, 40%)", { r: 51, g: 101, b: 153, a: 255 }],
        ["hsl(120deg 100% 25% / 0.5)", { r: 0, g: 128, b: 0, a: 128 }],
        ["hsl(-240 100% 50%)", { r: 0, g: 255, b: 0, a: 255 }]
    ])("reads %s without help", (text, expected) => {
        expect(parseColor(text)).toEqual(expected);
    });

    it.each(["", "   ", "#12", "#12345", "rgb(1, 2)", "hsl(1)", "not a color", "red", "url(x)"])(
        "returns null for %j without a document",
        text => {
            expect(parseColor(text)).toBeNull();
        }
    );

    describe("through a canvas", () => {
        function documentWithCanvas(paint: (color: string) => string | null, pixel = [0, 0, 0, 0]): Document {
            let current = "#000000";
            const context = {
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                getImageData: () => ({ data: pixel }),
                get fillStyle(): string {
                    return current;
                },
                set fillStyle(color: string) {
                    current = paint(color) ?? current;
                }
            };
            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
            return document;
        }

        it("reads a color name as the browser reports it", () => {
            const doc = documentWithCanvas(color => (color === "red" ? "#ff0000" : color));

            expect(parseColor("red", doc)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        });

        it("reads a transparent color as the browser reports it", () => {
            const doc = documentWithCanvas(color => (color === "transparent" ? "rgba(0, 0, 0, 0)" : color));

            expect(parseColor("transparent", doc)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        });

        it("reads the channels the browser reports, not a premultiplied pixel", () => {
            const doc = documentWithCanvas(color => (color === "translucent" ? "rgba(10, 20, 30, 0.5)" : color));

            expect(parseColor("translucent", doc)).toEqual({ r: 10, g: 20, b: 30, a: 128 });
        });

        it("reads the painted pixel for a notation it can't parse", () => {
            const doc = documentWithCanvas(color => color, [10, 20, 30, 255]);

            expect(parseColor("oklch(50% 0.1 200)", doc)).toEqual({ r: 10, g: 20, b: 30, a: 255 });
        });

        it("returns null for what the browser rejects", () => {
            const doc = documentWithCanvas(color => (color.startsWith("#") ? color : null));

            expect(parseColor("var(--brand)", doc)).toBeNull();
        });

        it("returns null when there is no canvas", () => {
            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

            expect(parseColor("red", document)).toBeNull();
        });
    });
});

describe("colorKey", () => {
    it.each([
        ["#ABCDEF", "#abcdef"],
        ["#fff", "#ffffff"],
        ["#FFFFFFFF", "#ffffff"],
        ["rgb(255, 255, 255)", "#ffffff"],
        ["hsl(0, 0%, 100%)", "#ffffff"],
        ["rgb(0 0 0 / 50%)", "#00000080"]
    ])("gives %s the key %s", (text, key) => {
        expect(colorKey(text)).toBe(key);
    });

    it("compares what it can't read as text, ignoring case", () => {
        expect(colorKey(" RED ")).toBe(colorKey("red"));
        expect(colorKey("red")).not.toBe(colorKey("blue"));
    });
});

describe("formatAlpha", () => {
    it("reads back as the same alpha for every byte", () => {
        for (let alpha = 0; alpha <= 255; alpha++) {
            expect(Math.round(formatAlpha(alpha) * 255), `alpha ${alpha}`).toBe(alpha);
        }
    });

    it.each([
        [0, 0],
        [255, 1],
        [128, 0.5],
        [64, 0.25],
        [129, 0.506]
    ])("writes %i as %d", (alpha, expected) => {
        expect(formatAlpha(alpha)).toBe(expected);
    });
});

describe("round trips", () => {
    const channels = [0, 1, 17, 18, 51, 52, 86, 102, 127, 128, 153, 170, 204, 250, 255];

    it("HSV brings back every color", () => {
        for (const r of channels) {
            for (const g of channels) {
                for (const b of channels) {
                    const hsv = rgba2hsva(r, g, b, 255);
                    expect(hsva2rgba(hsv.h, hsv.s, hsv.v, 255), `${r} ${g} ${b}`).toEqual({ r, g, b, a: 255 });
                }
            }
        }
    });

    it("the HSL the gradient writes brings back the colors that used to drift", () => {
        for (const [r, g, b] of [
            [0x12, 0x34, 0x56],
            [0x33, 0x66, 0x99],
            [0xfa, 0x80, 0x72]
        ]) {
            const hsl = rgba2hsla(r, g, b, 255);
            expect(parseColor(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`)).toEqual({ r, g, b, a: 255 });
        }
    });
});
