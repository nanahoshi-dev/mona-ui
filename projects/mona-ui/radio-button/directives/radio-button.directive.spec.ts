import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { RadioButtonDirective } from "./radio-button.directive";

@Component({
    template: `<input type="radio" monaRadioButton aria-label="Choice" />`,
    imports: [RadioButtonDirective]
})
class RadioButtonDirectiveHostComponent {}

describe("RadioButtonDirective", () => {
    let directive: RadioButtonDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new RadioButtonDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should use primary selection with semantic focus, disabled, and invalid states", () => {
        const fixture: ComponentFixture<RadioButtonDirectiveHostComponent> = TestBed.createComponent(
            RadioButtonDirectiveHostComponent
        );
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        expect(element.classList.contains("checked:after:bg-primary")).toBe(true);
        expect(element.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("disabled:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("[&.ng-touched.ng-invalid]:focus-visible:ring-error/35")).toBe(true);
    });
});
