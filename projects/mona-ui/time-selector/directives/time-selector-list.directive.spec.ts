import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { TimeSelectorListDirective } from "./time-selector-list.directive";

@Component({
    template: `<ol monaTimeSelectorList aria-label="Minutes" [popupHeight]="228" size="medium"></ol>`,
    imports: [TimeSelectorListDirective]
})
class ListHostComponent {}

describe("TimeSelectorListDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new TimeSelectorListDirective());
        expect(directive).toBeTruthy();
    });

    it("is a listbox in the Tab order, so keyboard users can reach and scroll it", () => {
        TestBed.configureTestingModule({ imports: [ListHostComponent] });
        const fixture = TestBed.createComponent(ListHostComponent);
        fixture.detectChanges();
        const list = (fixture.nativeElement as HTMLElement).querySelector("ol") as HTMLOListElement;

        expect(list.getAttribute("role")).toBe("listbox");
        expect(list.tabIndex).toBe(0);
        expect(list.style.paddingTop).toBe("100px");
    });
});
