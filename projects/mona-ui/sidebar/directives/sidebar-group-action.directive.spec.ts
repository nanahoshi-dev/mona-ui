import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarGroupActionDirective } from "./sidebar-group-action.directive";

@Component({
    template: `<button monaSidebarGroupAction>Add</button>`,
    imports: [SidebarGroupActionDirective]
})
class SidebarGroupActionHostComponent {}

describe("SidebarGroupActionDirective", () => {
    it("should render as a compact, self sized affordance outside a sidebar layout", () => {
        TestBed.configureTestingModule({ imports: [SidebarGroupActionHostComponent] });
        const fixture = TestBed.createComponent(SidebarGroupActionHostComponent);
        fixture.detectChanges();

        const button: HTMLElement = fixture.nativeElement.querySelector("button");
        expect(button.classList.contains("w-auto")).toBe(true);
        expect(button.classList.contains("h-auto")).toBe(true);
        // No SidebarService is available here, so the directive must not assume one.
        expect(button.style.display).toBe("");
    });
});
