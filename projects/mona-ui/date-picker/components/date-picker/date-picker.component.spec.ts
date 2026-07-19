import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, required } from "@angular/forms/signals";
import { datePopupThemeVariants } from "../../../date-input/styles/date-popup.styles";
import { DatePickerComponent } from "./date-picker.component";

describe("DatePickerComponent", () => {
    let fixture: ComponentFixture<DatePickerHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DatePickerHostComponent]
        });
        fixture = TestBed.createComponent(DatePickerHostComponent);
        fixture.detectChanges();
    });

    it("writes the signal-form value to the text box", () => {
        expect(getInput().value).toBe("02/01/2026");
    });

    it("uses one shared input shell without a nested focus ring", () => {
        const picker = fixture.nativeElement.querySelector("mona-date-picker") as HTMLElement;

        expect(
            picker.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(picker.classList.contains("border-input-border")).toBe(true);
        expect(picker.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(picker.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(picker.classList.contains("data-[invalid='true']:focus-within:ring-error/35")).toBe(true);
        expect(picker.classList.contains("[&_mona-text-box]:focus-within:ring-0")).toBe(true);
        expect(picker.classList.contains("[&_mona-text-box[data-invalid='true']]:ring-0")).toBe(true);
    });

    it("uses an overlay-tier popup instead of an input-tier surface", () => {
        const classes = datePopupThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);

        expect(classes).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(classes).toContain("border-border");
        expect(classes).toContain("shadow-(--shadow-overlay)");
        expect(classes).toContain(
            "[&_mona-calendar]:[background-color:var(--mona-date-popup-calendar-background,var(--mona-calendar-background))]!"
        );
        expect(classes).toContain(
            "[&_mona-calendar]:[backdrop-filter:var(--mona-date-popup-calendar-backdrop-filter,var(--mona-effect-raised-backdrop-filter))]!"
        );
        expect(classes).not.toContain("border-input-border");
    });

    it("updates the signal-form value from typed date text on blur", async () => {
        const input = getInput();

        input.value = "05/01/2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.form.date().value()?.getTime()).toBe(new Date(2026, 0, 5).getTime());
    });

    it("reflects disabled state from the signal-form schema", async () => {
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().disabled).toBe(true);
        expect(
            (fixture.nativeElement.querySelector("mona-date-picker") as HTMLElement).getAttribute("data-disabled")
        ).toBe("true");
    });

    it("reflects required invalid state after the field is touched", async () => {
        fixture.componentInstance.form.date().value.set(null);
        fixture.componentInstance.required.set(true);
        fixture.detectChanges();

        const input = getInput();
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    function getInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error("Expected date picker input");
        }
        return input;
    }
});

@Component({
    imports: [DatePickerComponent, FormField],
    template: `<mona-date-picker [formField]="form.date" format="dd/MM/yyyy"></mona-date-picker>`
})
class DatePickerHostComponent {
    public readonly disabled = signal(false);
    public readonly required = signal(false);
    readonly #model = signal<DatePickerFormModel>({ date: new Date(2026, 0, 2) });
    public readonly form = form(this.#model, schema => {
        disabled(schema.date, { when: () => this.disabled() });
        required(schema.date, { when: () => this.required() });
    });
}

interface DatePickerFormModel {
    date: Date | null;
}
