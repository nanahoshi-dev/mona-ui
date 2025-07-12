import { HSVA } from "../models/ColorSpaces";

export const rgba2hsva = (r: number | null, g: number | null, b: number | null, a: number | null): HSVA => {
    if (r == null || g == null || b == null) {
        return { h: 0, s: 0, v: 0, a: 255 };
    }

    r = r / 255;
    g = g / 255;
    b = b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s: number;
    const v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else if (max === b) {
            h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100),
        a: a ?? 255
    };
};
