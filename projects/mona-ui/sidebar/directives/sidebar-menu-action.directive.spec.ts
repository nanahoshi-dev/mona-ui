import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarMenuActionDirective } from "./sidebar-menu-action.directive";

@Component({
    template: `<button monaSidebarMenuAction>Action</button>`,
    imports: [SidebarMenuActionDirective]
})
class SidebarMenuActionHostComponent {}

describe("SidebarMenuActionDirective", () => {
    it("should render as a compact, self sized affordance", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuActionHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuActionHostComponent);
        fixture.detectChanges();

        const button: HTMLElement = fixture.nativeElement.querySelector("button");
        expect(button.classList.contains("w-auto")).toBe(true);
        expect(button.classList.contains("h-auto")).toBe(true);
    });
});
