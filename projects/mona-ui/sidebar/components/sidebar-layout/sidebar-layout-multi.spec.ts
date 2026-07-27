import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarInsetDirective } from "../../directives/sidebar-inset.directive";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { SidebarService } from "../../services/sidebar.service";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarLayoutComponent } from "./sidebar-layout.component";

/**
 * A layout holding a navigation column on one edge and an inspector on the other. The two are separate
 * sidebars sharing nothing but the viewport, so each keeps its own side, width and open state, and the
 * parts that sit beside them — the inset, and a trigger in a shared header — have to say which one they
 * mean.
 */
@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar id="nav" side="start" [(expanded)]="navExpanded">
                <a class="nav-link" href="/introduction">Introduction</a>
            </mona-sidebar>
            <main monaSidebarInset class="inset">
                <header>
                    <button monaSidebarTrigger class="nav-trigger">Navigation</button>
                    <button monaSidebarTrigger for="inspector" class="inspector-trigger">Inspector</button>
                    <button monaSidebarTrigger for="nowhere" class="orphan-trigger">Orphan</button>
                </header>
            </main>
            <mona-sidebar id="inspector" side="end" [(expanded)]="inspectorExpanded">
                <a class="inspector-link" href="/details">Details</a>
            </mona-sidebar>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective, SidebarTriggerDirective]
})
class MultiSidebarHostComponent {
    public readonly inspectorExpanded = signal(true);
    public readonly navExpanded = signal(true);
}

describe("Sidebar layout with more than one sidebar", () => {
    let fixture: ComponentFixture<MultiSidebarHostComponent>;
    let component: MultiSidebarHostComponent;
    let inspector: SidebarService;
    let layoutService: SidebarLayoutService;
    let nav: SidebarService;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const sidebarElement = (id: string): HTMLElement => query(`mona-sidebar#${id}`);

    const serviceFor = (id: string): SidebarService =>
        fixture.debugElement
            .query(node => node.name === "mona-sidebar" && node.nativeElement.getAttribute("id") === id)
            .injector.get(SidebarService);

    /** jsdom's `matchMedia` never matches, so the breakpoint is driven through the layout directly. */
    const goCompact = (): void => {
        layoutService.setCompact(true);
        fixture.detectChanges();
    };

    const click = (selector: string): void => {
        query(selector).click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [MultiSidebarHostComponent] });
        fixture = TestBed.createComponent(MultiSidebarHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        layoutService = fixture.debugElement
            .query(node => node.name === "mona-sidebar-layout")
            .injector.get(SidebarLayoutService);
        inspector = serviceFor("inspector");
        nav = serviceFor("nav");
    });

    describe("state isolation", () => {
        it("should give each sidebar its own service instance", () => {
            expect(nav).not.toBe(inspector);
        });

        it("should keep each sidebar's structural inputs to itself", () => {
            expect(nav.side()).toBe("start");
            expect(inspector.side()).toBe("end");
            expect(sidebarElement("nav").getAttribute("data-side")).toBe("start");
            expect(sidebarElement("inspector").getAttribute("data-side")).toBe("end");
        });

        it("should collapse one sidebar without touching the other", () => {
            nav.collapse();
            fixture.detectChanges();

            expect(component.navExpanded()).toBe(false);
            expect(component.inspectorExpanded()).toBe(true);
            expect(sidebarElement("nav").getAttribute("data-state")).toBe("collapsed");
            expect(sidebarElement("inspector").getAttribute("data-state")).toBe("expanded");
        });

        it("should drive each sidebar from its own two-way binding", () => {
            component.inspectorExpanded.set(false);
            fixture.detectChanges();

            expect(sidebarElement("inspector").getAttribute("data-state")).toBe("collapsed");
            expect(sidebarElement("nav").getAttribute("data-state")).toBe("expanded");
        });
    });

    describe("trigger targeting", () => {
        it("should point a for-targeted trigger at the sidebar it names", () => {
            expect(query(".inspector-trigger").getAttribute("aria-controls")).toBe("inspector");

            click(".inspector-trigger");

            expect(component.inspectorExpanded()).toBe(false);
            expect(component.navExpanded()).toBe(true);
        });

        it("should fall back to the first sidebar for a trigger that names none", () => {
            // The single-sidebar case, unchanged: a trigger in the inset still drives the sidebar
            // without having to name it.
            expect(query(".nav-trigger").getAttribute("aria-controls")).toBe("nav");

            click(".nav-trigger");

            expect(component.navExpanded()).toBe(false);
            expect(component.inspectorExpanded()).toBe(true);
        });

        it("should leave a trigger naming no known sidebar inert rather than throw", () => {
            const orphan = query(".orphan-trigger");
            expect(orphan.getAttribute("aria-controls")).toBeNull();
            expect(orphan.getAttribute("aria-expanded")).toBeNull();

            expect(() => click(".orphan-trigger")).not.toThrow();
            expect(component.navExpanded()).toBe(true);
            expect(component.inspectorExpanded()).toBe(true);
        });
    });

    describe("drawers", () => {
        it("should close the open drawer when the other one opens", () => {
            goCompact();

            click(".nav-trigger");
            expect(nav.mobileOpen()).toBe(true);

            click(".inspector-trigger");

            // Two drawers overlaying the same layout would stack their backdrops and fight over the
            // focus trap, and the viewport that puts them there has room for one.
            expect(nav.mobileOpen()).toBe(false);
            expect(inspector.mobileOpen()).toBe(true);
        });

        it("should paint one backdrop for whichever drawer is open", () => {
            goCompact();
            expect(query("[data-state='open']")).toBeNull();

            click(".inspector-trigger");
            expect(query("[data-state='open']")).toBeTruthy();

            click(".inspector-trigger");
            expect(query("[data-state='open']")).toBeNull();
        });

        it("should close whichever drawer is open from the backdrop", () => {
            goCompact();
            click(".inspector-trigger");

            query("[data-state='open']").click();
            fixture.detectChanges();

            expect(inspector.mobileOpen()).toBe(false);
        });

        it("should close whichever drawer is open on Escape", () => {
            goCompact();
            click(".nav-trigger");

            sidebarElement("nav").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            fixture.detectChanges();

            expect(nav.mobileOpen()).toBe(false);
        });

        it("should keep the drawers' open state apart from the docked state", () => {
            nav.collapse();
            fixture.detectChanges();

            goCompact();

            // Neither drawer opens itself just because a sidebar happened to be expanded on a desktop.
            expect(nav.mobileOpen()).toBe(false);
            expect(inspector.mobileOpen()).toBe(false);
        });
    });

    describe("the inset beside them", () => {
        it("should step out of the way for either drawer", () => {
            goCompact();
            expect(query(".inset").hasAttribute("inert")).toBe(false);

            click(".nav-trigger");
            expect(query(".inset").hasAttribute("inert")).toBe(true);

            click(".nav-trigger");
            expect(query(".inset").hasAttribute("inert")).toBe(false);

            click(".inspector-trigger");
            expect(query(".inset").hasAttribute("inert")).toBe(true);
        });
    });
});

describe("Sidebar layout with two sidebars sharing an id", () => {
    @Component({
        template: `
            <mona-sidebar-layout>
                <mona-sidebar id="dup" side="start"></mona-sidebar>
                <mona-sidebar id="dup" side="end"></mona-sidebar>
                <main monaSidebarInset>
                    <button monaSidebarTrigger for="dup" class="trigger">Toggle</button>
                </main>
            </mona-sidebar-layout>
        `,
        imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective, SidebarTriggerDirective]
    })
    class DuplicateIdHostComponent {}

    it("should resolve a for-targeted trigger to the later registration rather than throw", () => {
        TestBed.configureTestingModule({ imports: [DuplicateIdHostComponent] });
        const fixture = TestBed.createComponent(DuplicateIdHostComponent);
        expect(() => fixture.detectChanges()).not.toThrow();

        const [first, second] = fixture.debugElement
            .queryAll(node => node.name === "mona-sidebar")
            .map(node => node.injector.get(SidebarService));

        fixture.nativeElement.querySelector(".trigger").click();
        fixture.detectChanges();

        // Duplicate ids are a mistake in the markup, not something to recover from. The contract is
        // only that it stays predictable and does not take the page down.
        expect(second.expanded()).toBe(false);
        expect(first.expanded()).toBe(true);
    });
});
