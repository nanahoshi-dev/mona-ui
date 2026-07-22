import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TextBoxDirective } from "./text-box.directive";

@Component({
    template: `<input monaTextBox [invalid]="invalid()" [touched]="true" />`,
    imports: [TextBoxDirective]
})
class TextBoxDirectiveHostComponent {
    public readonly invalid = signal(false);
}

describe("TextBoxDirective", () => {
    let directive: TextBoxDirective;
    let fixture: ComponentFixture<TextBoxDirectiveHostComponent>;
    beforeEach(() => {
        directive = TestBed.runInInjectionContext(() => new TextBoxDirective());
        fixture = TestBed.createComponent(TextBoxDirectiveHostComponent);
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should use the shared input surface, focus, disabled, and invalid roles", () => {
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        expect(
            element.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(element.classList.contains("border-input-border")).toBe(true);
        expect(element.classList.contains("shadow-(--shadow-control)")).toBe(true);
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
