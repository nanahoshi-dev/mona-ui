import { HSLA } from "../../models/ColorSpaces";

export const string2Hsla = (hslText: string): HSLA => {
    const match = RegExp(
        /^hsla?\(\s*(\d{1,2}|[1-2]\d{2}|3[0-5]\d|360)\s*,\s*(\d{1,2}|100)%\s*,\s*(\d{1,2}|100)%\s*(?:,\s*(0|1|0?\.\d+))?\s*\)$/
    ).exec(hslText);
    if (match) {
        return {
            h: parseInt(match[1]),
            s: parseInt(match[2]),
            l: parseInt(match[3]),
            a: match[4] ? Math.round(parseFloat(match[4]) * 255) : 255
        };
    }
    return { h: 0, s: 0, l: 0, a: 255 };
};
