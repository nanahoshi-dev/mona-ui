import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";

import { SidebarDemoComponent, SidebarLayoutWrapperComponent } from "./sidebar-demo.component";

describe("SidebarDemoComponent", () => {
    it("should create", async () => {
        await TestBed.configureTestingModule({ imports: [SidebarDemoComponent] }).compileComponents();
        const fixture = TestBed.createComponent(SidebarDemoComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });
});

/**
 * Exercised through the wrapper rather than through `SidebarDemoComponent`, which wraps it in the
 * docs chrome and loads component metadata over HTTP — that request fails in jsdom and surfaces on
 * the second change detection pass, which is exactly what a state-by-state audit needs to do.
 */
describe("Sidebar demo accessibility", () => {
    let fixture: ComponentFixture<SidebarLayoutWrapperComponent>;

    const layout = (): HTMLElement => {
        const element = (fixture.nativeElement as HTMLElement).querySelector("mona-sidebar-layout");
        if (!element) {
            throw new Error("Expected the sidebar layout to be rendered.");
        }
        return element as HTMLElement;
    };

    /**
     * jsdom computes no colours, so the contrast rule can only ever report "incomplete" here; it is
     * covered by the theme's own contrast tests instead. Every other rule runs, in every state.
     */
    const audit = async (): Promise<axe.Result[]> => {
        const results = await axe.run(layout(), { rules: { "color-contrast": { enabled: false } } });
        return results.violations;
    };

    const toggle = (): void => {
        (layout().querySelector("[monaSidebarTrigger]") as HTMLElement).click();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [SidebarLayoutWrapperComponent] }).compileComponents();
        fixture = TestBed.createComponent(SidebarLayoutWrapperComponent);
        fixture.detectChanges();
    });

    it("has no AXE violations while expanded", async () => {
        expect(await audit()).toEqual([]);
    });

    it("has no AXE violations on the icon rail", async () => {
        // The state the previous audit never reached. Titles stand in for labels here, the group
        // headers close, and the submenu disclosure changes state.
        toggle();
        expect(await audit()).toEqual([]);
    });

    it("has no AXE violations once expanded again", async () => {
        toggle();
        toggle();
        expect(await audit()).toEqual([]);
    });

    it("has no AXE violations with the submenu open", async () => {
        (layout().querySelector("[monaCollapsibleTrigger]") as HTMLElement).click();
        fixture.detectChanges();

        expect(await audit()).toEqual([]);
    });

    it("has no AXE violations under RTL", async () => {
        layout().setAttribute("dir", "rtl");
        fixture.detectChanges();

        expect(await audit()).toEqual([]);
    });

    it("should navigate with real links rather than buttons", () => {
        const destinations = layout().querySelectorAll("a[monaSidebarMenuButton]");

        // Buttons cannot be opened in a new tab, middle-clicked, previewed in the status bar, or
        // followed when JavaScript fails, so every destination has to be an anchor.
        expect(destinations.length).toBeGreaterThan(0);
        for (const destination of Array.from(destinations)) {
            expect(destination.getAttribute("href")).toBeTruthy();
        }
    });

    it("should expose its navigation as a labelled landmark", () => {
        const nav = layout().querySelector("nav");
        expect(nav).toBeTruthy();
        expect(nav?.getAttribute("aria-label")).toBeTruthy();
    });
});
