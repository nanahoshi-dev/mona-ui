import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
import { TimePickerComponent } from "./time-picker.component";

describe("TimePickerComponent", () => {
    let fixture: ComponentFixture<TimePickerHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TimePickerHostComponent]
        });
        fixture = TestBed.createComponent(TimePickerHostComponent);
        fixture.detectChanges();
    });

    it("writes the signal-form value to the text box", () => {
        expect(getInput().value).toBe("09:30");
    });

    it("uses one shared input shell without a nested focus ring", () => {
        const picker = fixture.nativeElement.querySelector("mona-time-picker") as HTMLElement;

        expect(picker.classList.contains("bg-input-background")).toBe(true);
        expect(picker.classList.contains("border-input-border")).toBe(true);
        expect(picker.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(picker.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(picker.classList.contains("data-[invalid='true']:focus-within:ring-error/35")).toBe(true);
        expect(picker.classList.contains("[&_mona-text-box]:focus-within:ring-0")).toBe(true);
    });

    it("updates the signal-form value from typed time text on blur", async () => {
        const input = getInput();

        input.value = "14:45";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const value = fixture.componentInstance.form.value().value();
        expect(value?.getHours()).toBe(14);
        expect(value?.getMinutes()).toBe(45);
    });

    it("reflects disabled state from the signal-form schema", async () => {
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().disabled).toBe(true);
        expect(
            (fixture.nativeElement.querySelector("mona-time-picker") as HTMLElement).getAttribute("data-disabled")
        ).toBe("true");
    });

    it("reflects readonly state from the signal-form schema", async () => {
        fixture.componentInstance.readonly.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().readOnly).toBe(true);
        expect(
            (fixture.nativeElement.querySelector("mona-time-picker") as HTMLElement).getAttribute("data-readonly")
        ).toBe("true");
    });

    function getInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error("Expected time picker input");
        }
        return input;
    }
});

@Component({
    imports: [TimePickerComponent, FormField],
    template: `<mona-time-picker [formField]="form.value" format="HH:mm"></mona-time-picker>`
})
class TimePickerHostComponent {
    public readonly disabled = signal(false);
    public readonly readonly = signal(false);
    readonly #model = signal<TimePickerFormModel>({ value: new Date(2026, 0, 2, 9, 30) });
    public readonly form = form(this.#model, schema => {
        disabled(schema.value, { when: () => this.disabled() });
        readonly(schema.value, { when: () => this.readonly() });
    });
}

interface TimePickerFormModel {
    value: Date | null;
}
