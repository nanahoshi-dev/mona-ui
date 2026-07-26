import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { SidebarFooterDirective } from "./sidebar-footer.directive";

@Component({
    template: `<footer monaSidebarFooter class="custom-footer">Footer</footer>`,
    imports: [SidebarFooterDirective]
})
class SidebarFooterHostComponent {}

describe("SidebarFooterDirective", () => {
    it("should merge its own classes with the user supplied ones", () => {
        TestBed.configureTestingModule({ imports: [SidebarFooterHostComponent] });
        const fixture = TestBed.createComponent(SidebarFooterHostComponent);
        fixture.detectChanges();

        const footer: HTMLElement = fixture.nativeElement.querySelector("footer");
        expect(footer.classList.contains("p-2")).toBe(true);
        expect(footer.classList.contains("shrink-0")).toBe(true);
        expect(footer.classList.contains("custom-footer")).toBe(true);
    });
});
