import { createBlockScrollStrategy } from "@angular/cdk/overlay";
import { Injector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPageScrollBlockStrategy } from "./pageScrollBlock";

/*
 * The overflow is set with `overflow-y` rather than the `overflow` shorthand, which jsdom doesn't expand into the
 * longhands its computed style reports.
 */
describe("createPageScrollBlockStrategy", () => {
    const root = document.documentElement;
    const blocked = (): boolean => root.classList.contains("cdk-global-scrollblock");
    const enable = (): (() => void) => {
        const strategy = createPageScrollBlockStrategy(document, createBlockScrollStrategy(TestBed.inject(Injector)));
        strategy.enable();
        return () => strategy.disable();
    };

    // CDK only blocks a page that can scroll, which nothing can with no layout.
    beforeEach(() => vi.spyOn(root, "scrollHeight", "get").mockReturnValue(100000));

    afterEach(() => {
        vi.restoreAllMocks();
        root.style.removeProperty("overflow-y");
        document.body.style.removeProperty("overflow-y");
        root.classList.remove("cdk-global-scrollblock");
    });

    it("blocks a page whose root scrolls, and gives it back", () => {
        const disable = enable();
        expect(blocked()).toBe(true);
        disable();
        expect(blocked()).toBe(false);
    });

    it.each(["hidden", "clip"])("leaves a page alone whose html has overflow-y: %s", overflow => {
        root.style.overflowY = overflow;
        const disable = enable();
        expect(blocked()).toBe(false);
        disable();
        expect(root.style.overflowY).toBe(overflow);
    });

    it("leaves a page alone whose body hides the overflow for the viewport", () => {
        document.body.style.overflowY = "hidden";
        const disable = enable();
        expect(blocked()).toBe(false);
        disable();
    });

    it("still blocks when the body hides its overflow inside an html that scrolls", () => {
        root.style.overflowY = "auto";
        document.body.style.overflowY = "hidden";
        const disable = enable();
        expect(blocked()).toBe(true);
        disable();
    });
});
