import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ScrollViewComponent } from "../components/scroll-view/scroll-view.component";
import { ScrollViewSlideDirective } from "../directives/scroll-view-slide.directive";
import type { PagerOverlay } from "../models/PagerOverlay";

@Component({
    template: `
        <mona-scroll-view
            aria-label="Slides"
            height="200px"
            width="300px"
            [data]="items"
            [pageable]="true"
            [pagerOverlay]="overlay()">
            <ng-template monaScrollViewSlide let-item>{{ item }}</ng-template>
        </mona-scroll-view>
    `,
    imports: [ScrollViewComponent, ScrollViewSlideDirective]
})
class HostComponent {
    public readonly items = ["One", "Two"];
    public readonly overlay = signal<PagerOverlay>("dark");
}

describe("mona-scroll-view pager blur", () => {
    async function setup(overlay: PagerOverlay): Promise<HTMLElement | null> {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.overlay.set(overlay);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement.querySelector("[data-pager-root]");
    }

    function blurOf(pager: HTMLElement | null): string | undefined {
        return pager?.style.getPropertyValue("backdrop-filter");
    }

    it("blurs behind an overlay", async () => {
        expect(blurOf(await setup("dark"))).toBe("blur(3px)");
    });

    it("has nothing to blur behind with no overlay", async () => {
        expect(blurOf(await setup("none"))).toBe("");
    });
});
