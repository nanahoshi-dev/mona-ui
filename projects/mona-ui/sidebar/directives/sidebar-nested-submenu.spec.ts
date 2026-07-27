import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";

import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../components/sidebar-layout/sidebar-layout.component";
import { SidebarMenuItemDirective } from "./sidebar-menu-item.directive";
import { SidebarMenuSubDirective } from "./sidebar-menu-sub.directive";
import { SidebarMenuDirective } from "./sidebar-menu.directive";
import { SidebarTriggerDirective } from "./sidebar-trigger.directive";

/**
 * Submenus nested more than one level deep. Nothing in the sidebar limits the depth — a submenu is an
 * ordinary `monaCollapsible` on an ordinary item — but the rail behaviour is the part worth pinning
 * down, because every level has to stand aside for it and come back independently.
 */
@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar collapsible="icon" [(expanded)]="expanded">
                <ul monaSidebarMenu>
                    <li monaSidebarMenuItem monaCollapsible class="level-1">
                        <button monaCollapsibleTrigger class="trigger-1">Components</button>
                        <ul monaSidebarMenuSub monaCollapsibleContent class="sub-1">
                            <li monaSidebarMenuItem monaCollapsible class="level-2">
                                <button monaCollapsibleTrigger class="trigger-2">Inputs</button>
                                <ul monaSidebarMenuSub monaCollapsibleContent class="sub-2">
                                    <li monaSidebarMenuItem class="leaf">
                                        <a href="/text-box" class="leaf-link">Text box</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </mona-sidebar>
            <main>
                <button monaSidebarTrigger class="sidebar-trigger">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuSubDirective,
        SidebarTriggerDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        CollapsibleContentDirective
    ]
})
class NestedSubmenuHostComponent {
    public readonly expanded = signal(true);
}

describe("Sidebar submenus nested more than one level deep", () => {
    let fixture: ComponentFixture<NestedSubmenuHostComponent>;
    let component: NestedSubmenuHostComponent;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

    const click = (selector: string): void => {
        query(selector).click();
        fixture.detectChanges();
    };

    const isOpen = (trigger: string): boolean => query(trigger).getAttribute("aria-expanded") === "true";
    const isInert = (content: string): boolean => query(content).hasAttribute("inert");

    const goToRail = (): void => {
        component.expanded.set(false);
        fixture.detectChanges();
    };

    const leaveRail = (): void => {
        component.expanded.set(true);
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [NestedSubmenuHostComponent] });
        fixture = TestBed.createComponent(NestedSubmenuHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should render both levels", () => {
        expect(query(".level-1")).toBeTruthy();
        expect(query(".level-2")).toBeTruthy();
        expect(query(".leaf-link")).toBeTruthy();
    });

    it("should open each level independently", () => {
        expect(isOpen(".trigger-1")).toBe(false);
        expect(isOpen(".trigger-2")).toBe(false);

        click(".trigger-1");
        expect(isOpen(".trigger-1")).toBe(true);
        expect(isOpen(".trigger-2")).toBe(false);

        click(".trigger-2");
        expect(isOpen(".trigger-1")).toBe(true);
        expect(isOpen(".trigger-2")).toBe(true);
    });

    it("should point each level's trigger at its own submenu", () => {
        const first = query(".trigger-1").getAttribute("aria-controls");
        const second = query(".trigger-2").getAttribute("aria-controls");

        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        expect(first).not.toBe(second);
        expect(query(".sub-1").getAttribute("id")).toBe(first);
        expect(query(".sub-2").getAttribute("id")).toBe(second);
    });

    it("should close every level on the icon rail, at every depth", () => {
        click(".trigger-1");
        click(".trigger-2");

        goToRail();

        // A submenu cannot render in a rail one icon wide at any depth, and a trigger still reporting
        // itself expanded would describe something that is not there.
        expect(isOpen(".trigger-1")).toBe(false);
        expect(isOpen(".trigger-2")).toBe(false);
        expect(isInert(".sub-1")).toBe(true);
        expect(isInert(".sub-2")).toBe(true);
    });

    it("should restore every level that was open before the rail", () => {
        click(".trigger-1");
        click(".trigger-2");

        goToRail();
        leaveRail();

        expect(isOpen(".trigger-1")).toBe(true);
        expect(isOpen(".trigger-2")).toBe(true);
    });

    it("should leave a level that was closed before the rail closed", () => {
        click(".trigger-1");

        goToRail();
        leaveRail();

        // Only what was open comes back. The inner level was never opened, and coming out of the rail
        // is not the moment to open it for the first time.
        expect(isOpen(".trigger-1")).toBe(true);
        expect(isOpen(".trigger-2")).toBe(false);
    });

    it("should not open a nested level opened while on the rail", () => {
        goToRail();

        click(".trigger-2");
        leaveRail();

        expect(isOpen(".trigger-2")).toBe(false);
    });
});
