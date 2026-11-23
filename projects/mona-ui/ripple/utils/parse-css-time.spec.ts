import { describe, expect, it } from "vitest";
import { parseCssTime } from "./parse-css-time";

describe("parseCssTime", () => {
    it("reads milliseconds and seconds", () => {
        expect(parseCssTime("300ms", 0)).toBe(300);
        expect(parseCssTime("0.45s", 0)).toBe(450);
        expect(parseCssTime(".2S", 0)).toBe(200);
        expect(parseCssTime("  150ms ", 0)).toBe(150);
    });

    it("gives the fallback for anything that isn't a time", () => {
        expect(parseCssTime("", 300)).toBe(300);
        expect(parseCssTime("fast", 300)).toBe(300);
        expect(parseCssTime("200", 300)).toBe(300);
        expect(parseCssTime("-100ms", 300)).toBe(300);
        expect(parseCssTime("var(--mona-motion-fast)", 300)).toBe(300);
    });
});
