import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarInsetDirective } from "../../directives/sidebar-inset.directive";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import { SidebarService } from "../../services/sidebar.service";
import { SidebarLayoutComponent } from "./sidebar-layout.component";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [(expanded)]="expanded" [side]="side()" [width]="width()">
                <div class="sidebar-body">Navigation</div>
            </mona-sidebar>
            <main monaSidebarInset class="inset">
                <button monaSidebarTrigger class="trigger">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective, SidebarTriggerDirective]
})
class SidebarLayoutHostComponent {
    public readonly expanded = signal(true);
    public readonly layout = viewChild.required(SidebarLayoutComponent);
    public readonly side = signal<"left" | "right">("left");
    public readonly width = signal<string | number>("16rem");
}

describe("SidebarLayoutComponent", () => {
    let fixture: ComponentFixture<SidebarLayoutHostComponent>;
    let component: SidebarLayoutHostComponent;

    const getSidebar = (): HTMLElement => fixture.nativeElement.querySelector("mona-sidebar");

    // `calc()` is reordered and folded differently by each engine, so both sides go through the same
    // serialiser rather than being compared as literal text.
    const asCssWidth = (value: string): string => {
        const probe = document.createElement("div");
        probe.style.width = value;
        return probe.style.width;
    };

    const getTrigger = (): HTMLElement => fixture.nativeElement.querySelector(".trigger");

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarLayoutHostComponent] });
        fixture = TestBed.createComponent(SidebarLayoutHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component.layout()).toBeTruthy();
    });

    it("should project the sidebar and the inset", () => {
        expect(fixture.nativeElement.querySelector(".sidebar-body").textContent).toContain("Navigation");
        expect(fixture.nativeElement.querySelector(".inset")).toBeTruthy();
    });

    it("should point the trigger at the sidebar through aria-controls", () => {
        const sidebarId = getSidebar().getAttribute("id");
        expect(sidebarId).toBeTruthy();
        expect(getTrigger().getAttribute("aria-controls")).toBe(sidebarId);
        expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    });

    it("should collapse the sidebar to zero width from the trigger", () => {
        expect(getSidebar().style.width).toBe(asCssWidth("calc(16rem + 1px)"));
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");

        getTrigger().click();
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe("0px");
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
        expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    });

    it("should push trigger driven changes back out through the two-way binding", () => {
        getTrigger().click();
        fixture.detectChanges();
        expect(component.expanded()).toBe(false);

        getTrigger().click();
        fixture.detectChanges();
        expect(component.expanded()).toBe(true);
    });

    it("should apply an expanded value bound from the outside", () => {
        component.expanded.set(false);
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe("0px");
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });

    it("should treat a numeric width as pixels", () => {
        component.width.set(240);
        fixture.detectChanges();
        expect(getSidebar().style.width).toBe(asCssWidth("calc(240px + 1px)"));
    });

    it("should order and border the sidebar according to side", () => {
        // Logical, not physical. Flex order is already direction-relative, so a physical border
        // would land on the outer edge instead of the inner one under RTL.
        expect(getSidebar().classList.contains("order-first")).toBe(true);
        expect(getSidebar().classList.contains("border-e")).toBe(true);

        component.side.set("right");
        fixture.detectChanges();

        expect(getSidebar().classList.contains("order-last")).toBe(true);
        expect(getSidebar().classList.contains("border-s")).toBe(true);
    });

    it("should expose the sidebar's own service instance to its descendants", () => {
        const service = fixture.debugElement.query(node => node.name === "mona-sidebar").injector.get(SidebarService);
        service.collapse();
        fixture.detectChanges();

        expect(component.expanded()).toBe(false);
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });
});
