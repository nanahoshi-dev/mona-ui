import { LiveAnnouncer } from "@angular/cdk/a11y";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { injectLiveAnnouncer } from "./injectLiveAnnouncer";

/** The live region CDK's announcer adds to the end of `<body>`. */
function liveRegion(): HTMLElement {
    const region = document.querySelector<HTMLElement>("body > .cdk-live-announcer-element");
    if (!region) {
        throw new Error("The announcer's live region isn't in the document.");
    }
    return region;
}

describe("injectLiveAnnouncer", () => {
    it("returns the application's announcer", () => {
        const announcer = TestBed.runInInjectionContext(() => injectLiveAnnouncer());

        expect(announcer).toBe(TestBed.inject(LiveAnnouncer));
    });

    // Nothing else here loads CDK's styles: no focus trap, no cdkAriaLive, no global stylesheet.
    it("hides what it announces on a page with nothing else from CDK", async () => {
        const announcer = TestBed.runInInjectionContext(() => injectLiveAnnouncer());

        await announcer.announce("3 results available");

        const region = liveRegion();
        const style = getComputedStyle(region);
        expect(region.textContent).toBe("3 results available");
        expect(style.position).toBe("absolute");
        expect(style.width).toBe("1px");
        expect(style.height).toBe("1px");
        expect(style.overflow).toBe("hidden");
        expect(style.clip.replace(/\s+/g, "")).toMatch(/^rect\(0(px)?,?0(px)?,?0(px)?,?0(px)?\)$/);
    });
});
