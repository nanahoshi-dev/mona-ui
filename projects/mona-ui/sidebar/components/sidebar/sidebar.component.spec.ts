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

        expect(getSidebar().style.width).toBe("3rem");
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });

    it("should treat a numeric icon width as pixels", () => {
        component.collapsible.set("icon");
        component.iconWidth.set(48);
        fixture.detectChanges();
        collapse();

        expect(getSidebar().style.width).toBe("48px");
    });

    it("should refuse to collapse in none mode", () => {
        component.collapsible.set("none");
        fixture.detectChanges();
        collapse();

        expect(getSidebar().style.width).toBe("16rem");
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");
        expect(component.expanded()).toBe(true);
    });

    it("should ignore an externally bound collapsed value in none mode", () => {
        component.collapsible.set("none");
        fixture.detectChanges();
        component.expanded.set(false);
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe("16rem");
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");
    });

    it("should keep full width parts visible while expanded in icon mode", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();

        expect(query(".group-label").style.display).toBe("");
        expect(query(".group-action").style.display).toBe("");
        expect(query(".menu-sub").style.display).toBe("");
    });

    it("should stand down full width parts on the icon rail", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        collapse();

        expect(query(".group-label").style.display).toBe("none");
        expect(query(".group-action").style.display).toBe("none");
        expect(query(".menu-sub").style.display).toBe("none");
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

        expect(query(".group-label").style.display).toBe("");
        expect(query(".menu-sub").style.display).toBe("");
    });

    it("should tighten the menu and centre its items on the rail", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();
        collapse();

        const menu = query(".menu");
        expect(menu.classList.contains("items-center")).toBe(true);
        expect(menu.classList.contains("ps-4")).toBe(false);
    });

    it("should stop a collapsible item from stacking on the rail, since its submenu is gone", () => {
        component.collapsible.set("icon");
        fixture.detectChanges();

        const item = query(".menu-item");
        expect(item.classList.contains("flex-col")).toBe(true);

        collapse();

        expect(item.classList.contains("flex-row")).toBe(true);
        expect(item.classList.contains("flex-col")).toBe(false);
        expect(item.classList.contains("w-8")).toBe(true);
    });
});
