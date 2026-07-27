import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarMenuButtonDirective } from "./sidebar-menu-button.directive";
import { SidebarMenuItemDirective } from "./sidebar-menu-item.directive";

@Component({
    template: `
        <li monaSidebarMenuItem [active]="active()">
            <button monaSidebarMenuButton>Item</button>
            <button>Action</button>
        </li>
    `,
    imports: [SidebarMenuButtonDirective, SidebarMenuItemDirective]
})
class SidebarMenuButtonHostComponent {
    public readonly active = signal(false);
}

describe("SidebarMenuButtonDirective", () => {
    it("should render a full width, left aligned row that highlights on hover", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuButtonHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuButtonHostComponent);
        fixture.detectChanges();

        const button: HTMLElement = fixture.nativeElement.querySelector("button");
        expect(button.classList.contains("w-full")).toBe(true);
        expect(button.classList.contains("justify-start")).toBe(true);
        // No `!important` any more: the row owns its own class binding instead of composing
        // `ButtonDirective`, so nothing of its own is competing to be overridden.
        expect(button.classList.contains("hover:bg-(--color-sidebar-accent)")).toBe(true);
        expect(button.classList.contains("rounded-md")).toBe(true);
        expect(button.getAttribute("type")).toBe("button");
    });

    it("should expose the current destination on the navigation control", () => {
        TestBed.configureTestingModule({ imports: [SidebarMenuButtonHostComponent] });
        const fixture = TestBed.createComponent(SidebarMenuButtonHostComponent);
        fixture.componentInstance.active.set(true);
        fixture.detectChanges();

        const button: HTMLElement = fixture.nativeElement.querySelector("button");
        expect(button.getAttribute("aria-current")).toBe("page");
        expect(button.hasAttribute("data-active")).toBe(false);

        fixture.componentInstance.active.set(false);
        fixture.detectChanges();
        expect(button.hasAttribute("aria-current")).toBe(false);
    });
});
