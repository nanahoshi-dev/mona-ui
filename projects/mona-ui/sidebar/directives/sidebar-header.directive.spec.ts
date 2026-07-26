import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarHeaderDirective } from "./sidebar-header.directive";

@Component({
    template: `<header monaSidebarHeader class="custom-header">Header</header>`,
    imports: [SidebarHeaderDirective]
})
class SidebarHeaderHostComponent {}

describe("SidebarHeaderDirective", () => {
    it("should merge its own classes with the user supplied ones", () => {
        TestBed.configureTestingModule({ imports: [SidebarHeaderHostComponent] });
        const fixture = TestBed.createComponent(SidebarHeaderHostComponent);
        fixture.detectChanges();

        const header: HTMLElement = fixture.nativeElement.querySelector("header");
        expect(header.classList.contains("p-2")).toBe(true);
        expect(header.classList.contains("shrink-0")).toBe(true);
        expect(header.classList.contains("custom-header")).toBe(true);
    });
});
