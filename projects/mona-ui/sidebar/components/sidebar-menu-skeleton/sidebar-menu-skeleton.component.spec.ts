import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import type { SidebarCollapsibleMode } from "../../models/SidebarCollapsibleMode";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../sidebar-layout/sidebar-layout.component";
import { SidebarMenuSkeletonComponent } from "./sidebar-menu-skeleton.component";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [collapsible]="collapsible()">
                <mona-sidebar-menu-skeleton [showIcon]="showIcon()" [labelWidth]="labelWidth()" />
            </mona-sidebar>
            <button monaSidebarTrigger class="trigger">Toggle</button>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarMenuSkeletonComponent, SidebarTriggerDirective]
})
class SidebarSkeletonHostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("icon");
    public readonly labelWidth = signal<string | number>("60%");
    public readonly showIcon = signal(true);
}

describe("SidebarMenuSkeletonComponent", () => {
    let fixture: ComponentFixture<SidebarSkeletonHostComponent>;
    let component: SidebarSkeletonHostComponent;

    const skeletons = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll("mona-skeleton"));
    const collapse = (): void => {
        (fixture.nativeElement.querySelector(".trigger") as HTMLElement).click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarSkeletonHostComponent] });
        fixture = TestBed.createComponent(SidebarSkeletonHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should render an icon block and a label bar at full width", () => {
        const bars = skeletons();
        expect(bars.length).toBe(2);
        expect(bars[0].style.width).toBe("1rem");
        expect(bars[1].style.width).toBe("60%");
    });

    it("should carry the label bar out of view on the icon rail rather than delete it", () => {
        collapse();

        // Removing it would empty the row on the first frame, ahead of the sidebar it sits in. It stays
        // in the DOM and is pushed past the host's clipped edge by the widened gap, exactly as a real
        // menu button treats its own label.
        const bars = skeletons();
        expect(bars.length).toBe(2);
        expect(bars[0].style.width).toBe("1rem");
        expect(fixture.nativeElement.querySelector("mona-sidebar-menu-skeleton").classList).toContain("overflow-hidden");
    });

    it("should omit the icon block when asked", () => {
        component.showIcon.set(false);
        fixture.detectChanges();

        const bars = skeletons();
        expect(bars.length).toBe(1);
        expect(bars[0].style.width).toBe("60%");
    });

    it("should accept a numeric label width as pixels", () => {
        component.labelWidth.set(90);
        fixture.detectChanges();

        expect(skeletons()[1].style.width).toBe("90px");
    });

    it("should match the height of a real menu row", () => {
        const host: HTMLElement = fixture.nativeElement.querySelector("mona-sidebar-menu-skeleton");
        expect(host.classList.contains("h-8")).toBe(true);

        // Same inset and gap a real menu button uses on the rail, so the two shrink in step rather
        // than the placeholder snapping to a square of its own.
        collapse();
        expect(host.classList.contains("w-full")).toBe(true);
        expect(host.classList.contains("px-2")).toBe(true);
        expect(host.classList.contains("gap-8")).toBe(true);
    });
});
