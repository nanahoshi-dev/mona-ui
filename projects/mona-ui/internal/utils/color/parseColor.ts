import type { RGBA } from "../../models/ColorSpaces";
import { isValidHex } from "./colorRegexes";
import { hex2rgba } from "./hex2rgba";
import { hsla2hsva } from "./hsla2hsva";
import { hsva2rgba } from "./hsva2rgba";
import { rgba2hex } from "./rgba2hex";

const NUMBER = "[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?";
const SEPARATOR = "(?:\\s*,\\s*|\\s+)";
const ALPHA = `(?:\\s*[,/]\\s*(${NUMBER}%?))?`;
const RGB_PATTERN = new RegExp(
    `^rgba?\\(\\s*(${NUMBER}%?)${SEPARATOR}(${NUMBER}%?)${SEPARATOR}(${NUMBER}%?)${ALPHA}\\s*\\)$`,
    "i"
);
const HSL_PATTERN = new RegExp(
    `^hsla?\\(\\s*(${NUMBER})(?:deg)?${SEPARATOR}(${NUMBER})%?${SEPARATOR}(${NUMBER})%?${ALPHA}\\s*\\)$`,
    "i"
);

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value));

const parseAlpha = (text: string | undefined): number => {
    if (text === undefined) {
        return 255;
    }
    const opacity = text.endsWith("%") ? parseFloat(text) / 100 : parseFloat(text);
    return Math.round(clamp(opacity, 1) * 255);
};

const parseRgbChannel = (text: string): number => {
    const channel = text.endsWith("%") ? (parseFloat(text) / 100) * 255 : parseFloat(text);
    return Math.round(clamp(channel, 255));
};

const parseFunctionalColor = (color: string): RGBA | null => {
    const rgb = RGB_PATTERN.exec(color);
    if (rgb) {
        return {
            r: parseRgbChannel(rgb[1]),
            g: parseRgbChannel(rgb[2]),
            b: parseRgbChannel(rgb[3]),
            a: parseAlpha(rgb[4])
        };
    }
    const hsl = HSL_PATTERN.exec(color);
    if (hsl) {
        const hue = ((parseFloat(hsl[1]) % 360) + 360) % 360;
        const hsv = hsla2hsva(hue, clamp(parseFloat(hsl[2]), 100), clamp(parseFloat(hsl[3]), 100), parseAlpha(hsl[4]));
        return hsva2rgba(hsv.h, hsv.s, hsv.v, hsv.a);
    }
    return null;
};

/**
 * Asks the browser about everything else it can paint: color names, `transparent`, `oklch()`, `color-mix()` and so on.
 * A color the browser rejects leaves `fillStyle` as it was, so it reads differently from two starting points.
 */
const readThroughCanvas = (color: string, document: Document): RGBA | null => {
    const context = document.createElement("canvas").getContext?.("2d", { willReadFrequently: true });
    if (!context) {
        return null;
    }
    context.fillStyle = "#000000";
    context.fillStyle = color;
    const fromBlack = context.fillStyle;
    context.fillStyle = "#ffffff";
    context.fillStyle = color;
    if (typeof fromBlack !== "string" || context.fillStyle !== fromBlack) {
        return null;
    }
    if (isValidHex(fromBlack)) {
        return hex2rgba(fromBlack);
    }
    const legacy = parseFunctionalColor(fromBlack);
    if (legacy) {
        return legacy;
    }
    // Wider color spaces keep their own notation in `fillStyle`, so read what actually gets painted.
    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a };
};

/**
 * Reads a CSS color. Hex, `rgb()` and `hsl()` in both their comma and space forms need nothing but the text; with a
 * `document`, anything else the browser can paint is read through a canvas.
 * @returns The channels, each from 0 to 255, or null when the text isn't a color.
 */
export const parseColor = (text: string, document?: Document): RGBA | null => {
    const color = text.trim();
    if (!color) {
        return null;
    }
    if (isValidHex(color)) {
        return hex2rgba(color);
    }
    return parseFunctionalColor(color) ?? (document ? readThroughCanvas(color, document) : null);
};

/**
 * A key that is equal for two spellings of the same color, such as `#ABC`, `#aabbcc` and `rgb(170, 187, 204)`. Text that
 * can't be read as a color only compares equal to itself, ignoring case.
 */
export const colorKey = (text: string, document?: Document): string => {
    const color = parseColor(text, document);
    return color ? rgba2hex(color.r, color.g, color.b, color.a) : text.trim().toLowerCase();
};

/**
 * The shortest opacity, as CSS writes it, that still reads back as the same 8-bit alpha. A saved `0.5` stays `0.5`.
 */
export const formatAlpha = (alpha: number): number => {
    const short = Math.round((alpha / 255) * 100) / 100;
    return Math.round(short * 255) === alpha ? short : Math.round((alpha / 255) * 1000) / 1000;
};
