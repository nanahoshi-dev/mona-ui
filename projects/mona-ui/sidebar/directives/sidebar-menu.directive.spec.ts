import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarMenuDirective } from "./sidebar-menu.directive";

@Component({
    template: `<ul monaSidebarMenu></ul>`,
    imports: [SidebarMenuDirective]
})
class SidebarMenuHostComponent {}

describe("SidebarMenuDirective", () => {
    it("should stretch to its container and leave the inset to it", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuHostComponent);
        fixture.detectChanges();

        const menu: HTMLElement = fixture.nativeElement.querySelector("ul");
        expect(menu.classList.contains("flex-col")).toBe(true);
        expect(menu.classList.contains("w-full")).toBe(true);
        // An inset here would have to change with the rail state, and a consumer overriding it would be
        // fighting `ps-*`/`pe-*` with `px-*`, which `tailwind-merge` keeps side by side. The enclosing
        // group, header or footer owns it instead, and holds it steady.
        for (const inset of ["ps-4", "pe-2", "px-2", "p-2"]) {
            expect(menu.classList.contains(inset)).toBe(false);
        }
    });
});
