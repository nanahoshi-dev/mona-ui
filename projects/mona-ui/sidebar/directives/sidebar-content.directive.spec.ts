import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../components/sidebar-layout/sidebar-layout.component";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import { SidebarContentDirective } from "./sidebar-content.directive";
import { SidebarTriggerDirective } from "./sidebar-trigger.directive";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [collapsible]="collapsible()">
                <div monaSidebarContent class="content">Items</div>
            </mona-sidebar>
            <button monaSidebarTrigger class="trigger">Toggle</button>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarContentDirective, SidebarTriggerDirective]
})
class SidebarContentHostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("icon");
}

describe("SidebarContentDirective", () => {
    let fixture: ComponentFixture<SidebarContentHostComponent>;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const collapse = (): void => {
        query(".trigger").click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarContentHostComponent] });
        fixture = TestBed.createComponent(SidebarContentHostComponent);
        fixture.detectChanges();
    });

    it("should scroll its overflow while the sidebar is at full width", () => {
        expect(query(".content").classList.contains("overflow-y-auto")).toBe(true);
        expect(query(".content").classList.contains("flex-1")).toBe(true);
    });

    it("should clip rather than scroll on the icon rail, where a scrollbar has no room", () => {
        collapse();

        // A scrollbar comes out of the content box. At a 3rem rail it claimed 15px of 48, leaving the
        // icon buttons 17px wide instead of 32 — every icon in the region visibly squeezed.
        expect(query(".content").classList.contains("overflow-hidden")).toBe(true);
        expect(query(".content").classList.contains("overflow-y-auto")).toBe(false);
    });

    it("should keep scrolling in offcanvas mode, which has no rail to run out of room on", () => {
        fixture.componentInstance.collapsible.set("offcanvas");
        fixture.detectChanges();
        collapse();

        expect(query(".content").classList.contains("overflow-y-auto")).toBe(true);
    });
});
