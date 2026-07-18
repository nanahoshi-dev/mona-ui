import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { TextBoxDirective } from "./text-box.directive";

@Component({
    template: `<input monaTextBox />`,
    imports: [TextBoxDirective]
})
class TextBoxDirectiveHostComponent {}

describe("TextBoxDirective", () => {
    let directive: TextBoxDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new TextBoxDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should use the shared input surface, focus, disabled, and invalid roles", () => {
        const fixture: ComponentFixture<TextBoxDirectiveHostComponent> = TestBed.createComponent(
            TextBoxDirectiveHostComponent
        );
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        expect(element.classList.contains("bg-input-background")).toBe(true);
        expect(element.classList.contains("border-input-border")).toBe(true);
        expect(element.classList.contains("shadow-xs")).toBe(true);
        expect(element.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("disabled:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("[&.ng-touched.ng-invalid]:focus-visible:ring-error/35")).toBe(true);
    });
});
