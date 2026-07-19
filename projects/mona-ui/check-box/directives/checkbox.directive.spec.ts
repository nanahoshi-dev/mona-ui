import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CheckboxDirective } from "./checkbox.directive";

@Component({
    template: `<input type="checkbox" monaCheckbox />`,
    imports: [CheckboxDirective]
})
class CheckboxDirectiveHostComponent {}

describe("CheckboxDirective", () => {
    let directive: CheckboxDirective;
    beforeEach(() => {
        directive = TestBed.runInInjectionContext(() => new CheckboxDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should use primary selection with semantic focus, disabled, and invalid states", () => {
        const fixture: ComponentFixture<CheckboxDirectiveHostComponent> =
            TestBed.createComponent(CheckboxDirectiveHostComponent);
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        expect(element.classList.contains("checked:bg-primary")).toBe(true);
        expect(element.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("disabled:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("[&.ng-touched.ng-invalid]:focus-visible:ring-error/35")).toBe(true);
    });
});
