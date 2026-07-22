import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CheckboxDirective } from "./checkbox.directive";

@Component({
    template: `<input type="checkbox" monaCheckbox [invalid]="invalid()" [touched]="true" />`,
    imports: [CheckboxDirective]
})
class CheckboxDirectiveHostComponent {
    public readonly invalid = signal(false);
}

describe("CheckboxDirective", () => {
    let directive: CheckboxDirective;
    let fixture: ComponentFixture<CheckboxDirectiveHostComponent>;
    beforeEach(() => {
        directive = TestBed.runInInjectionContext(() => new CheckboxDirective());
        fixture = TestBed.createComponent(CheckboxDirectiveHostComponent);
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should use primary selection with semantic focus, disabled, and invalid states", () => {
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        expect(element.classList.contains("checked:bg-primary")).toBe(true);
        expect(element.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("disabled:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("data-[invalid='true']:focus-visible:ring-error/35")).toBe(true);
    });

    it("should reflect the invalid state on the host element", () => {
        fixture.componentInstance.invalid.set(true);
        fixture.detectChanges();

        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        expect(element.getAttribute("data-invalid")).toBe("true");
        expect(element.getAttribute("aria-invalid")).toBe("true");
    });
});
