import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarMenuButtonDirective } from "./sidebar-menu-button.directive";

@Component({
    template: `<button monaSidebarMenuButton>Item</button>`,
    imports: [SidebarMenuButtonDirective]
})
class SidebarMenuButtonHostComponent {}

describe("SidebarMenuButtonDirective", () => {
    it("should render a full width, left aligned row that highlights on hover", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuButtonHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuButtonHostComponent);
        fixture.detectChanges();

        const button: HTMLElement = fixture.nativeElement.querySelector("button");
        expect(button.classList.contains("w-full")).toBe(true);
        expect(button.classList.contains("justify-start")).toBe(true);
        expect(button.classList.contains("hover:bg-accent")).toBe(true);
        expect(button.classList.contains("rounded-md")).toBe(true);
    });
});
