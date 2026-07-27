import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective } from "@nanahoshi/mona-ui/collapsible";

import { SidebarGroupActionDirective } from "../../directives/sidebar-group-action.directive";
import { SidebarGroupHeaderDirective } from "../../directives/sidebar-group-header.directive";
import { SidebarGroupLabelDirective } from "../../directives/sidebar-group-label.directive";
import { SidebarMenuItemDirective } from "../../directives/sidebar-menu-item.directive";
import { SidebarMenuSubDirective } from "../../directives/sidebar-menu-sub.directive";
import { SidebarMenuDirective } from "../../directives/sidebar-menu.directive";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import type { SidebarCollapsibleMode } from "../../models/SidebarCollapsibleMode";
import { SidebarLayoutComponent } from "../sidebar-layout/sidebar-layout.component";
import { SidebarComponent } from "./sidebar.component";

@Component({
    template: `
        <mona-sidebar-layout [(expanded)]="expanded">
            <mona-sidebar [collapsible]="collapsible()" [iconWidth]="iconWidth()">
                <div monaSidebarGroupHeader class="group-header">
                    <div monaSidebarGroupLabel class="group-label">Components</div>
                    <button monaSidebarGroupAction class="group-action">Add</button>
                </div>
                <ul monaSidebarMenu class="menu">
                    <li monaSidebarMenuItem monaCollapsible class="menu-item">
                        <button monaCollapsibleTrigger>Lists</button>
                        <ul monaSidebarMenuSub monaCollapsibleContent class="menu-sub">
                            <li monaSidebarMenuItem>Child</li>
                        </ul>
                    </li>
                </ul>
            </mona-sidebar>
            <button monaSidebarTrigger class="trigger">Toggle</button>
        </mona-sidebar-layout>
    `,
    imports: [
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarTriggerDirective,
        SidebarGroupHeaderDirective,
        SidebarGroupLabelDirective,
        SidebarGroupActionDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuSubDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        CollapsibleContentDirective
    ]
})
class SidebarModeHostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("offcanvas");
    public readonly expanded = signal(true);
    public readonly iconWidth = signal<string | number>("3rem");
}

describe("SidebarComponent collapsible modes", () => {
    let fixture: ComponentFixture<SidebarModeHostComponent>;
    let component: SidebarModeHostComponent;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const getSidebar = (): HTMLElement => query("mona-sidebar");

    // `calc()` is reordered and folded differently by each engine, so both sides go through the same
    // serialiser rather than being compared as literal text.
    const asCssWidth = (value: string): string => {
        const probe = document.createElement("div");
        probe.style.width = value;
        return probe.style.width;
    };


    const collapse = (): void => {
        query(".trigger").click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarModeHostComponent] });
        fixture = TestBed.createComponent(SidebarModeHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should expose the mode through data-collapsible", () => {
        expect(getSidebar().getAttribute("data-collapsible")).toBe("offcanvas");

        component.collapsible.set("icon");
        fixture.detectChanges();
        expect(getSidebar().getAttribute("data-collapsible")).toBe("icon");
    });

    it("should collapse to zero width in offcanvas mode", () => {
        collapse();
        expect(getSidebar().style.width).toBe("0px");
    });

    it("should collapse to the icon rail width in icon mode", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        collapse();

        expect(getSidebar().style.width).toBe(asCssWidth("calc(3rem + 1px)"));
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });

    it("should treat a numeric icon width as pixels", () => {
        component.collapsible.set("icon");
        component.iconWidth.set(48);
        fixture.detectChanges();
        collapse();

        expect(getSidebar().style.width).toBe(asCssWidth("calc(48px + 1px)"));
    });

    it("should refuse to collapse in none mode", () => {
        component.collapsible.set("none");
        fixture.detectChanges();
        collapse();

        expect(getSidebar().style.width).toBe(asCssWidth("calc(16rem + 1px)"));
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");
        expect(component.expanded()).toBe(true);
    });

    it("should ignore an externally bound collapsed value in none mode", () => {
        component.collapsible.set("none");
        fixture.detectChanges();
        component.expanded.set(false);
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe(asCssWidth("calc(16rem + 1px)"));
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");
    });

    it("should keep full width parts visible while expanded in icon mode", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();

        expect(query(".group-label").style.opacity).toBe("1");
        expect(query(".group-action").style.opacity).toBe("1");
        expect(query(".menu-sub").style.display).toBe("");
    });

    it("should stand down full width parts on the icon rail", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        collapse();

        // Faded rather than dropped, so they leave over the same interval the sidebar takes to narrow.
        // `visibility` is what takes them out of the accessibility tree and tab order once it lands.
        expect(query(".group-label").style.opacity).toBe("0");
        expect(query(".group-label").style.visibility).toBe("hidden");
        expect(query(".group-action").style.opacity).toBe("0");
        expect(query(".group-action").style.visibility).toBe("hidden");
        // The submenu is no longer hidden behind the disclosure's back. The item closes the
        // collapsible on the rail instead, so the trigger stops claiming it is expanded and the
        // collapsible content directive applies its own `inert`.
        expect(query(".menu-sub").style.display).toBe("");
        expect(query(".menu-sub").hasAttribute("inert")).toBe(true);
        expect(query("[monaCollapsibleTrigger]").getAttribute("aria-expanded")).toBe("false");
    });

    it("should collapse the group header row away rather than leave an empty gap on the rail", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        expect(query(".group-header").classList.contains("h-8")).toBe(true);

        collapse();

        expect(query(".group-header").classList.contains("h-0")).toBe(true);
        expect(query(".group-header").classList.contains("h-8")).toBe(false);
    });

    it("should not stand parts down in offcanvas mode, where the whole sidebar is gone", () => {
        collapse();

        expect(query(".group-label").style.opacity).toBe("1");
        expect(query(".menu-sub").style.display).toBe("");
    });

    it("should hold the menu's layout steady across the rail state", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        const before = query(".menu").className;

        collapse();

        // Nothing about the menu changes on collapse. Its inset comes from the region around it and
        // stays put, and its items stay stretched to it, so the row simply narrows with the sidebar
        // instead of re-insetting and re-centring part way through the width animation.
        expect(query(".menu").className).toBe(before);
        expect(query(".menu").classList.contains("items-center")).toBe(false);
    });

    it("should stop a collapsible item from stacking on the rail, since its submenu is gone", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();

        const item = query(".menu-item");
        expect(item.classList.contains("flex-col")).toBe(true);

        collapse();

        expect(item.classList.contains("flex-row")).toBe(true);
        expect(item.classList.contains("flex-col")).toBe(false);
    });

    it("should leave the item's width to the menu so it narrows with the sidebar", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        collapse();

        // A fixed rail width here would snap the row to its final size on the first frame, ahead of the
        // sidebar it sits in. Stretching to the menu instead makes the two move together.
        expect(query(".menu-item").classList.contains("w-8")).toBe(false);
    });
});
