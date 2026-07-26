import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarMenuDirective } from "./sidebar-menu.directive";

@Component({
    template: `<ul monaSidebarMenu></ul>`,
    imports: [SidebarMenuDirective]
})
class SidebarMenuHostComponent {}

describe("SidebarMenuDirective", () => {
    it("should fall back to its full width layout outside a sidebar layout", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuHostComponent);
        fixture.detectChanges();

        const menu: HTMLElement = fixture.nativeElement.querySelector("ul");
        expect(menu.classList.contains("flex-col")).toBe(true);
        expect(menu.classList.contains("w-full")).toBe(true);
        // No SidebarService is available here, so the directive must not assume the icon rail.
        expect(menu.classList.contains("ps-4")).toBe(true);
        expect(menu.classList.contains("items-center")).toBe(false);
    });
});
