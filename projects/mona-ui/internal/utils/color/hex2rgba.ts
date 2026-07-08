import { RGBA } from "../../models/ColorSpaces";

export const hex2rgba = (hex: string): RGBA => {
    let r = 0,
        g = 0,
        b = 0,
        a = 255;
    if (hex.length == 4 || hex.length == 5) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
        if (hex.length == 5) {
            a = parseInt(hex[4] + hex[4], 16);
        }
    } else if (hex.length == 7 || hex.length == 9) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
        if (hex.length == 9) {
            a = parseInt(hex.slice(7, 9), 16);
        }
    }
    return { r: r, g: g, b: b, a: a };
};
