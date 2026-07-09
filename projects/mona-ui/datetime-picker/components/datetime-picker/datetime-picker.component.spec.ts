import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
import { DateTimePickerComponent } from "./datetime-picker.component";

describe("DateTimePickerComponent", () => {
    let fixture: ComponentFixture<DateTimePickerHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerHostComponent]
        });
        fixture = TestBed.createComponent(DateTimePickerHostComponent);
        fixture.detectChanges();
    });

    it("writes the signal-form value to the text box", () => {
        expect(getInput().value).toBe("02/01/2026 09:30");
    });

    it("updates the signal-form value from typed date-time text on blur", async () => {
        const input = getInput();

        input.value = "05/01/2026 14:45";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.form.value().value()?.getTime()).toBe(new Date(2026, 0, 5, 14, 45).getTime());
    });

    it("reflects disabled state from the signal-form schema", async () => {
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().disabled).toBe(true);
    });

    it("reflects readonly state from the signal-form schema", async () => {
        fixture.componentInstance.readonly.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().readOnly).toBe(true);
    });

    function getInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error("Expected date time picker input");
        }
        return input;
    }
});

@Component({
    imports: [DateTimePickerComponent, FormField],
    template: `<mona-datetime-picker [formField]="form.value" format="dd/MM/yyyy HH:mm"></mona-datetime-picker>`
})
class DateTimePickerHostComponent {
    public readonly disabled = signal(false);
    public readonly readonly = signal(false);
    readonly #model = signal<DateTimePickerFormModel>({ value: new Date(2026, 0, 2, 9, 30) });
    public readonly form = form(this.#model, schema => {
        disabled(schema.value, { when: () => this.disabled() });
        readonly(schema.value, { when: () => this.readonly() });
    });
}

interface DateTimePickerFormModel {
    value: Date | null;
}
