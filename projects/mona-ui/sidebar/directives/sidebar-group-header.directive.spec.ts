import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarGroupHeaderDirective } from "./sidebar-group-header.directive";

@Component({
    template: `<div monaSidebarGroupHeader>Header</div>`,
    imports: [SidebarGroupHeaderDirective]
})
class SidebarGroupHeaderHostComponent {}

describe("SidebarGroupHeaderDirective", () => {
    it("should reserve its full height row outside a sidebar layout", () => {
        TestBed.configureTestingModule({ imports: [SidebarGroupHeaderHostComponent] });
        const fixture = TestBed.createComponent(SidebarGroupHeaderHostComponent);
        fixture.detectChanges();

        const header: HTMLElement = fixture.nativeElement.querySelector("div");
        expect(header.classList.contains("flex")).toBe(true);
        // No SidebarService is available here, so the directive must not assume the icon rail.
        expect(header.classList.contains("h-8")).toBe(true);
        expect(header.classList.contains("h-0")).toBe(false);
    });
});
