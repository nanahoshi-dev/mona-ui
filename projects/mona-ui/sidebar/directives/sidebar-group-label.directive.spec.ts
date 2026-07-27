import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarGroupLabelDirective } from "./sidebar-group-label.directive";

@Component({
    template: `<div monaSidebarGroupLabel>Components</div>`,
    imports: [SidebarGroupLabelDirective]
})
class SidebarGroupLabelHostComponent {}

describe("SidebarGroupLabelDirective", () => {
    it("should render as a quiet, small caps style label outside a sidebar layout", () => {
        TestBed.configureTestingModule({ imports: [SidebarGroupLabelHostComponent] });
        const fixture = TestBed.createComponent(SidebarGroupLabelHostComponent);
        fixture.detectChanges();

        const label: HTMLElement = fixture.nativeElement.querySelector("div");
        expect(label.classList.contains("text-xs")).toBe(true);
        expect(label.classList.contains("font-medium")).toBe(true);
        // No SidebarService is available here, so the directive must not assume one.
        expect(label.classList.contains("opacity-100")).toBe(true);
    });
});
