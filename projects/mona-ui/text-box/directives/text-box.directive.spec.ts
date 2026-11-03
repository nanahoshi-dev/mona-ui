import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, required } from "@angular/forms/signals";
import { inputThemeVariants } from "../styles/textbox.styles";
import { TextBoxDirective } from "./text-box.directive";

@Component({
    template: `<input monaTextBox [invalid]="invalid()" [touched]="true" />`,
    imports: [TextBoxDirective]
})
class TextBoxDirectiveHostComponent {
    public readonly invalid = signal(false);
}

@Component({
    template: `<input monaTextBox invalid touched />`,
    imports: [TextBoxDirective]
})
class BareAttributeHostComponent {}

@Component({
    template: `<input monaTextBox [formField]="form.city" />`,
    imports: [TextBoxDirective, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal({ city: "" });
    public readonly form = form(this.#model, schema => required(schema.city));
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

    it("should accept bare boolean attributes", () => {
        const host = TestBed.createComponent(BareAttributeHostComponent);
        host.detectChanges();

        const element = host.nativeElement.querySelector("input") as HTMLInputElement;
        expect(element.getAttribute("data-invalid")).toBe("true");
        expect(element.getAttribute("aria-invalid")).toBe("true");
    });

    it("pads a fully rounded input the same at every size", () => {
        for (const size of ["small", "medium", "large"] as const) {
            const classes = inputThemeVariants({ rounded: "full", size }).split(/\s+/);

            expect(classes).toContain("px-4");
        }
    });

    it("uses text-base for the large size", () => {
        const classes = inputThemeVariants({ rounded: "medium", size: "large" }).split(/\s+/);

        expect(classes).toContain("text-base");
        expect(classes).not.toContain("text-md");
    });

    it("takes invalid and touched from a signal form field", () => {
        const host = TestBed.createComponent(SignalFormHostComponent);
        host.detectChanges();
        const element = host.nativeElement.querySelector("input") as HTMLInputElement;
        expect(element.hasAttribute("data-invalid")).toBe(false);

        host.componentInstance.form.city().markAsTouched();
        host.detectChanges();

        expect(element.getAttribute("data-invalid")).toBe("true");
        expect(element.getAttribute("aria-invalid")).toBe("true");
    });
});
