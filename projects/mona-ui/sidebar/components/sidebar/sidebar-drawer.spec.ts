import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarInsetDirective } from "../../directives/sidebar-inset.directive";
import { SidebarMenuButtonDirective } from "../../directives/sidebar-menu-button.directive";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import type { SidebarSide } from "../../models/SidebarSide";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { SidebarService } from "../../services/sidebar.service";
import { SidebarLayoutComponent } from "../sidebar-layout/sidebar-layout.component";
import { SidebarComponent } from "./sidebar.component";

@Component({
    template: `
        <mona-sidebar-layout [mobileBreakpoint]="breakpoint()">
            <mona-sidebar collapsible="icon" aria-label="Main" [side]="side()">
                <a monaSidebarMenuButton href="/introduction" class="link">Introduction</a>
                <button monaSidebarMenuButton [closeOnSelect]="false" class="action">Action</button>
            </mona-sidebar>
            <main monaSidebarInset class="inset">
                <button monaSidebarTrigger class="trigger">Toggle</button>
                <button class="outside">Outside</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarInsetDirective,
        SidebarTriggerDirective,
        SidebarMenuButtonDirective
    ]
})
class SidebarDrawerHostComponent {
    public readonly breakpoint = signal(768);
    public readonly side = signal<SidebarSide>("start");
}

describe("Sidebar drawer on a compact viewport", () => {
    let fixture: ComponentFixture<SidebarDrawerHostComponent>;
    let layoutService: SidebarLayoutService;
    let service: SidebarService;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const sidebar = (): HTMLElement => query("mona-sidebar");

    /**
     * jsdom's `matchMedia` never matches, so the breakpoint is driven through the layout directly.
     * That is the same signal the media query feeds, so everything downstream of it is exercised.
     */
    const goCompact = (): void => {
        layoutService.setCompact(true);
        fixture.detectChanges();
    };
    const openDrawer = (): void => {
        goCompact();
        query(".trigger").click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarDrawerHostComponent] });
        fixture = TestBed.createComponent(SidebarDrawerHostComponent);
        layoutService = fixture.debugElement
            .query(node => node.name === "mona-sidebar-layout")
            .injector.get(SidebarLayoutService);
        service = fixture.debugElement.query(node => node.name === "mona-sidebar").injector.get(SidebarService);
        fixture.detectChanges();
    });

    const waitForStable = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    describe("presentation", () => {
        it("should become a modal dialog rather than a column", () => {
            openDrawer();

            expect(sidebar().getAttribute("role")).toBe("dialog");
            expect(sidebar().getAttribute("aria-modal")).toBe("true");
            expect(sidebar().getAttribute("aria-label")).toBe("Main");
            expect(sidebar().classList.contains("absolute")).toBe(true);
        });

        it("should slide out of view rather than shrink, so its contents do not reflow every frame", () => {
            goCompact();
            expect(sidebar().classList.contains("-translate-x-full")).toBe(true);

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);
        });

        it("should slide towards whichever edge it is docked against", () => {
            fixture.componentInstance.side.set("end");
            goCompact();

            expect(sidebar().classList.contains("translate-x-full")).toBe(true);
        });

        it("should dock against logical start edge and slide out in semantic RTL", async () => {
            fixture.nativeElement.setAttribute("dir", "rtl");
            await waitForStable();
            fixture.componentInstance.side.set("start");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(true);
            // In RTL, start maps to physical right, anchored at right-0 and translated off-screen via translate-x-full
            expect(sidebar().classList.contains("right-0")).toBe(true);
            expect(sidebar().classList.contains("translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("left-0")).toBe(false);
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().classList.contains("translate-x-full")).toBe(false);
        });

        it("should dock against logical end edge and slide out in semantic RTL", async () => {
            fixture.nativeElement.setAttribute("dir", "rtl");
            await waitForStable();
            fixture.componentInstance.side.set("end");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(true);
            // In RTL, end maps to physical left, anchored at left-0 and translated off-screen via -translate-x-full
            expect(sidebar().classList.contains("left-0")).toBe(true);
            expect(sidebar().classList.contains("-translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("right-0")).toBe(false);
            expect(sidebar().classList.contains("translate-x-full")).toBe(false);

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);
        });

        it("should maintain coherent LTR drawer start positioning and translation under CSS-only direction override", () => {
            fixture.nativeElement.setAttribute("dir", "ltr");
            fixture.nativeElement.style.direction = "rtl";
            fixture.componentInstance.side.set("start");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(false);
            expect(sidebar().matches(":dir(ltr)")).toBe(true);
            expect(sidebar().classList.contains("left-0")).toBe(true);
            expect(sidebar().classList.contains("-translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("right-0")).toBe(false);
            expect(sidebar().getAttribute("data-side")).toBe("start");
            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
            expect(sidebar().style.width).toBe("calc(1px + 18rem)");

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().getAttribute("data-state")).toBe("expanded");
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);
        });

        it("should maintain coherent LTR drawer end positioning and translation under CSS-only direction override", () => {
            fixture.nativeElement.setAttribute("dir", "ltr");
            fixture.nativeElement.style.direction = "rtl";
            fixture.componentInstance.side.set("end");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(false);
            expect(sidebar().matches(":dir(ltr)")).toBe(true);
            expect(sidebar().classList.contains("right-0")).toBe(true);
            expect(sidebar().classList.contains("translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("left-0")).toBe(false);
            expect(sidebar().getAttribute("data-side")).toBe("end");
            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
            expect(sidebar().style.width).toBe("calc(1px + 18rem)");

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().getAttribute("data-state")).toBe("expanded");
            expect(sidebar().classList.contains("translate-x-full")).toBe(false);
        });

        it("should maintain coherent RTL drawer start positioning and translation under CSS-only direction override", async () => {
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.nativeElement.style.direction = "ltr";
            await waitForStable();
            fixture.componentInstance.side.set("start");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(true);
            expect(sidebar().matches(":dir(ltr)")).toBe(false);
            expect(sidebar().classList.contains("right-0")).toBe(true);
            expect(sidebar().classList.contains("translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("left-0")).toBe(false);
            expect(sidebar().getAttribute("data-side")).toBe("start");
            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
            expect(sidebar().style.width).toBe("calc(1px + 18rem)");

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().getAttribute("data-state")).toBe("expanded");
            expect(sidebar().classList.contains("translate-x-full")).toBe(false);
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);
        });

        it("should maintain coherent RTL drawer end positioning and translation under CSS-only direction override", async () => {
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.nativeElement.style.direction = "ltr";
            await waitForStable();
            fixture.componentInstance.side.set("end");
            goCompact();

            expect(sidebar().matches(":dir(rtl)")).toBe(true);
            expect(sidebar().matches(":dir(ltr)")).toBe(false);
            expect(sidebar().classList.contains("left-0")).toBe(true);
            expect(sidebar().classList.contains("-translate-x-full")).toBe(true);
            expect(sidebar().classList.contains("right-0")).toBe(false);
            expect(sidebar().getAttribute("data-side")).toBe("end");
            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
            expect(sidebar().style.width).toBe("calc(1px + 18rem)");

            query(".trigger").click();
            fixture.detectChanges();
            expect(sidebar().getAttribute("data-state")).toBe("expanded");
            expect(sidebar().classList.contains("-translate-x-full")).toBe(false);
            expect(sidebar().classList.contains("translate-x-full")).toBe(false);
        });

        it("should never present an icon rail, having the room to show everything", () => {
            openDrawer();
            service.collapse();
            fixture.detectChanges();

            expect(service.iconOnly()).toBe(false);
        });
    });

    describe("modality", () => {
        it("should take the closed drawer out of the tab order and the accessibility tree", () => {
            goCompact();

            expect(sidebar().hasAttribute("inert")).toBe(true);
            expect(sidebar().getAttribute("aria-hidden")).toBe("true");
        });

        it("should release the drawer once open", () => {
            openDrawer();

            expect(sidebar().hasAttribute("inert")).toBe(false);
            expect(sidebar().hasAttribute("aria-hidden")).toBe(false);
        });

        it("should make everything behind an open drawer inert and unscrollable", () => {
            openDrawer();

            expect(query(".inset").hasAttribute("inert")).toBe(true);
            expect(query(".inset").classList.contains("overflow-hidden!")).toBe(true);
        });

        it("should give the layout back once the drawer closes", () => {
            openDrawer();
            service.collapse();
            fixture.detectChanges();

            expect(query(".inset").hasAttribute("inert")).toBe(false);
            expect(query(".inset").classList.contains("overflow-hidden!")).toBe(false);
        });

        it("should close on Escape", () => {
            openDrawer();

            sidebar().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            fixture.detectChanges();

            expect(service.mobileOpen()).toBe(false);
        });

        it("should leave Escape alone while docked, where the sidebar is part of the page", () => {
            query(".trigger").click();
            fixture.detectChanges();
            const before = service.expanded();

            sidebar().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            fixture.detectChanges();

            expect(service.expanded()).toBe(before);
        });

        it("should close when the backdrop is clicked", () => {
            openDrawer();

            const backdrop: HTMLElement = fixture.nativeElement.querySelector("[data-state='open']");
            expect(backdrop).toBeTruthy();
            backdrop.click();
            fixture.detectChanges();

            expect(service.mobileOpen()).toBe(false);
        });

        it("should restore focus only after the layout behind it is reachable again", async () => {
            const trigger = query(".trigger") as HTMLButtonElement;
            trigger.focus();
            openDrawer();

            const inside = sidebar().querySelector("a") as HTMLElement;
            inside.focus();
            expect(sidebar().contains(document.activeElement)).toBe(true);

            service.collapse();
            fixture.detectChanges();
            await fixture.whenStable();

            /*
             * The trigger sits in the inset, which is still `inert` at the point the drawer's own
             * state flips. Restoring focus there and then does nothing at all — `focus()` inside an
             * inert subtree is silently ignored — and focus was left stranded inside the panel that
             * was about to become inert itself.
             */
            expect(document.activeElement).toBe(trigger);
            expect(sidebar().contains(document.activeElement)).toBe(false);
        });

        it("should leave focus alone if it has since moved out of the drawer", async () => {
            openDrawer();
            const outside = query(".outside") as HTMLButtonElement;
            outside.focus();

            service.collapse();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(document.activeElement).toBe(outside);
        });

        it("should keep the backdrop out of the accessibility tree", () => {
            openDrawer();

            const backdrop: HTMLElement = fixture.nativeElement.querySelector("[data-state='open']");
            expect(backdrop.getAttribute("aria-hidden")).toBe("true");
        });
    });

    describe("state separation", () => {
        it("should not inherit the desktop collapsed state when the viewport narrows", () => {
            query(".trigger").click();
            fixture.detectChanges();
            expect(service.expanded()).toBe(false);

            goCompact();

            // A drawer that opened itself just because the desktop sidebar happened to be expanded
            // would cover the page the moment a window was resized.
            expect(service.mobileOpen()).toBe(false);
        });

        it("should reset an open drawer when the viewport widens again", () => {
            openDrawer();
            expect(service.mobileOpen()).toBe(true);

            layoutService.setCompact(false);
            fixture.detectChanges();

            expect(service.mobileOpen()).toBe(false);
        });
    });

    describe("closing after navigation", () => {
        it("should close the drawer when a link is followed", () => {
            openDrawer();

            query(".link").click();
            fixture.detectChanges();

            expect(service.mobileOpen()).toBe(false);
        });

        it("should leave the drawer open for a row that opted out", () => {
            openDrawer();

            query(".action").click();
            fixture.detectChanges();

            expect(service.mobileOpen()).toBe(true);
        });

        it("should not touch the docked sidebar when a link is followed", () => {
            query(".link").click();
            fixture.detectChanges();

            expect(service.expanded()).toBe(true);
        });
    });
});
