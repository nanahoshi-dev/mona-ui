import { afterEach, describe, expect, it } from "vitest";
import { codeRegionLabel, watchScrollableRegion } from "./scrollableRegion";

/** jsdom doesn't lay anything out, so the sizes the check reads are set by hand. */
function sized(element: HTMLElement, scrollWidth: number, clientWidth: number): void {
    Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
    Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 20 });
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 20 });
}

describe("watchScrollableRegion", () => {
    let stop: () => void = () => undefined;

    afterEach(() => {
        stop();
        document.body.replaceChildren();
    });

    it("makes a block that scrolls a named region that takes focus", () => {
        const pre = document.body.appendChild(document.createElement("pre"));
        sized(pre, 400, 200);

        stop = watchScrollableRegion(pre, () => "HTML code");

        expect(pre.tabIndex).toBe(0);
        expect(pre.getAttribute("role")).toBe("region");
        expect(pre.getAttribute("aria-label")).toBe("HTML code");
    });

    it("adds no tab stop to a block that fits", () => {
        const pre = document.body.appendChild(document.createElement("pre"));
        sized(pre, 200, 200);

        stop = watchScrollableRegion(pre, () => "HTML code");

        expect(pre.hasAttribute("tabindex")).toBe(false);
        expect(pre.hasAttribute("role")).toBe(false);
        expect(pre.hasAttribute("aria-label")).toBe(false);
    });

    it("checks again when the content changes", async () => {
        const pre = document.body.appendChild(document.createElement("pre"));
        sized(pre, 200, 200);
        stop = watchScrollableRegion(pre, () => "Code");

        sized(pre, 600, 200);
        pre.textContent = "a line long enough to scroll";
        await Promise.resolve();

        expect(pre.getAttribute("tabindex")).toBe("0");
    });
});

describe("codeRegionLabel", () => {
    it("names the language when it's known", () => {
        expect(codeRegionLabel("html")).toBe("HTML code");
        expect(codeRegionLabel("typescript")).toBe("TypeScript code");
        expect(codeRegionLabel("ts")).toBe("TypeScript code");
    });

    it("falls back to Code", () => {
        expect(codeRegionLabel("plaintext")).toBe("Code");
        expect(codeRegionLabel(undefined)).toBe("Code");
    });
});
