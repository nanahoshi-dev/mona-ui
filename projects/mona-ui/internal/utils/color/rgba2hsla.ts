import { HSLA } from "../../models/ColorSpaces";

export const rgba2hsla = (
    red: number | null,
    green: number | null,
    blue: number | null,
    alpha: number | null
): HSLA => {
    if (red == null || green == null || blue == null) {
        return { h: 0, s: 0, l: 0, a: 255 };
    }
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s: number;
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) {
        h = s = 0;
    } else {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
        a: alpha ?? 255
    };
};
