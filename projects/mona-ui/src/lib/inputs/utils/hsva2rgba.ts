import { RGBA } from "../models/ColorSpaces";

export const hsva2rgba = (
    hue: number | null,
    saturation: number | null,
    value: number | null,
    alpha: number | null
): RGBA => {
    if (hue == null || saturation == null || value == null) {
        return { r: 0, g: 0, b: 0, a: 255 };
    }
    const h = hue;
    const s = saturation / 100;
    const v = value / 100;
    const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return {
        r: Math.round(f(5) * 255),
        g: Math.round(f(3) * 255),
        b: Math.round(f(1) * 255),
        a: alpha ?? 255
    };
};
