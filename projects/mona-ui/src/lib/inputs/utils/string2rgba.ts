import { RGBA } from "../models/ColorSpaces";

export const string2rgba = (rgbText: string): RGBA => {
    const match = RegExp(
        /^rgba?\(\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/
    ).exec(rgbText);
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] ? Math.round(parseFloat(match[4]) * 255) : 255
        };
    }
    return { r: 0, g: 0, b: 0, a: 255 };
};
