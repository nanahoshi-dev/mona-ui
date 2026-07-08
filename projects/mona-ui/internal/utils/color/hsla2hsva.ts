import { HSVA } from "../../models/ColorSpaces";

export const hsla2hsva = (
    hue: number | null,
    saturation: number | null,
    lightness: number | null,
    alpha: number | null
): HSVA => {
    if (hue == null || saturation == null || lightness == null) {
        return { h: 0, s: 0, v: 0, a: 255 };
    }

    const h = hue;
    const s = saturation / 100;
    const l = lightness / 100;

    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    return {
        h: h,
        s: sv * 100,
        v: v * 100,
        a: alpha ?? 255
    };
};
