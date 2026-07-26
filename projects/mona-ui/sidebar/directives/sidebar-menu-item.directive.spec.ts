import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";

import { SidebarMenuItemDirective } from "./sidebar-menu-item.directive";
import { SidebarMenuSubDirective } from "./sidebar-menu-sub.directive";

@Component({
    template: `
        <ul>
            <li monaSidebarMenuItem class="plain-item" [active]="active()">
                <button>Plain</button>
                <button>Action</button>
            </li>
            <li monaSidebarMenuItem monaCollapsible class="collapsible-item">
                <button monaCollapsibleTrigger>Toggle</button>
                <ul monaSidebarMenuSub monaCollapsibleContent class="sub-menu">
                    <li monaSidebarMenuItem><button>Child</button></li>
                </ul>
            </li>
        </ul>
    `,
    imports: [
        SidebarMenuItemDirective,
        SidebarMenuSubDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        CollapsibleContentDirective
    ]
})
class SidebarMenuHostComponent {
    public readonly active = signal(false);
}

describe("SidebarMenuItemDirective", () => {
    let fixture: ComponentFixture<SidebarMenuHostComponent>;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarMenuHostComponent] });
        fixture = TestBed.createComponent(SidebarMenuHostComponent);
        fixture.detectChanges();
    });

    it("should lay a plain item out as a row", () => {
        const item = query(".plain-item");
        expect(item.classList.contains("flex-row")).toBe(true);
        expect(item.classList.contains("items-center")).toBe(true);
        expect(item.classList.contains("hover:bg-(--color-sidebar-accent)")).toBe(true);
    });

    it("should apply the current destination surface to the complete row", () => {
        fixture.componentInstance.active.set(true);
        fixture.detectChanges();

        const item = query(".plain-item");
        expect(item.getAttribute("data-active")).toBe("true");
        expect(item.classList.contains("data-[active=true]:bg-(--color-sidebar-primary)")).toBe(true);
        expect(item.classList.contains("data-[active=true]:text-(--color-sidebar-primary-foreground)")).toBe(true);

        fixture.componentInstance.active.set(false);
        fixture.detectChanges();
        expect(item.hasAttribute("data-active")).toBe(false);
    });

    it("should stack an item that is also a collapsible root", () => {
        const item = query(".collapsible-item");
        expect(item.classList.contains("flex-col")).toBe(true);
        expect(item.classList.contains("items-stretch")).toBe(true);
        expect(item.classList.contains("flex-row")).toBe(false);
        // The row hover would otherwise bleed onto the whole expanded submenu.
        expect(item.classList.contains("hover:bg-(--color-sidebar-accent)")).toBe(false);
    });

    it("should let the submenu carry both the sidebar and the collapsible content directives", () => {
        const subMenu = query(".sub-menu");
        expect(subMenu.classList.contains("border-l")).toBe(true);
        expect(subMenu.getAttribute("data-state")).toBe("closed");
        expect(subMenu.hasAttribute("id")).toBe(true);
        expect(subMenu.hasAttribute("inert")).toBe(true);
    });

    it("should expand the submenu from the trigger", () => {
        const trigger = query("[monaCollapsibleTrigger]");
        trigger.click();
        fixture.detectChanges();

        expect(query(".collapsible-item").getAttribute("data-state")).toBe("open");
        expect(query(".sub-menu").hasAttribute("inert")).toBe(false);
    });
});
