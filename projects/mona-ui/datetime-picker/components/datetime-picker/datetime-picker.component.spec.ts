import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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

    it("uses one shared input shell without a nested focus ring", () => {
        const picker = fixture.nativeElement.querySelector("mona-datetime-picker") as HTMLElement;

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
        expect(
            (fixture.nativeElement.querySelector("mona-datetime-picker") as HTMLElement).getAttribute("data-disabled")
        ).toBe("true");
    });

    it("reflects readonly state from the signal-form schema", async () => {
        fixture.componentInstance.readonly.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getInput().readOnly).toBe(true);
        expect(
            (fixture.nativeElement.querySelector("mona-datetime-picker") as HTMLElement).getAttribute("data-readonly")
        ).toBe("true");
    });

    it("renders default english accessible labels and messages in popup", () => {
        const toggleBtn = fixture.nativeElement.querySelector("button[monaButton]") as HTMLButtonElement;
        expect(toggleBtn.getAttribute("aria-label")).toBe("Open date and time picker");

        toggleBtn.click();
        fixture.detectChanges();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Date and time picker");

        const tabButtons = popup.querySelectorAll("button[role='tab']");
        expect(tabButtons[0]?.textContent?.trim()).toBe("Date");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Time");

        const calendarContainer = popup.querySelector("div[aria-label='Calendar']");
        expect(calendarContainer).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Set");
        expect(footerButtons[1]?.textContent?.trim()).toBe("Cancel");
    });

    it("updates messages dynamically when locale changes", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            messages: {
                dateTimePicker: {
                    calendar: "Takvim",
                    cancel: "İptal",
                    date: "Tarih",
                    dateTimePicker: "Tarih ve saat seçici",
                    openDateTimePicker: "Tarih ve saat seçiciyi aç",
                    set: "Ayarla",
                    time: "Saat",
                    timePicker: "Saat seçici"
                }
            }
        });
        fixture.detectChanges();

        const toggleBtn = fixture.nativeElement.querySelector("button[monaButton]") as HTMLButtonElement;
        expect(toggleBtn.getAttribute("aria-label")).toBe("Tarih ve saat seçiciyi aç");

        toggleBtn.click();
        fixture.detectChanges();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Tarih ve saat seçici");

        const tabButtons = popup.querySelectorAll("button[role='tab']");
        expect(tabButtons[0]?.textContent?.trim()).toBe("Tarih");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Saat");

        const calendarContainer = popup.querySelector("div[aria-label='Takvim']");
        expect(calendarContainer).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Ayarla");
        expect(footerButtons[1]?.textContent?.trim()).toBe("İptal");

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("inverts alt+arrow keyboard tab switching in RTL mode", async () => {
        const i18n = TestBed.inject(MonaI18nService);
        const toggleBtn = fixture.nativeElement.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();

        const host = fixture.nativeElement.querySelector("mona-datetime-picker") as HTMLElement;

        // In LTR: Alt+ArrowRight moves to time
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }));
        fixture.detectChanges();
        let popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup.querySelector("div[aria-label='Time picker']")).not.toBeNull();

        // Switch to RTL locale and DOM
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            direction: "rtl"
        });
        host.setAttribute("dir", "rtl");
        await fixture.whenStable();
        fixture.detectChanges();

        // In RTL: Alt+ArrowRight moves to date
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }));
        fixture.detectChanges();
        popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup.querySelector("div[aria-label='Calendar']")).not.toBeNull();

        // In RTL: Alt+ArrowLeft moves to time
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true }));
        fixture.detectChanges();
        popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup.querySelector("div[aria-label='Time picker']")).not.toBeNull();

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    function getInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error("Expected date time picker input");
        }
        return input;
    }
});

interface DateTimePickerFormModel {
    value: Date | null;
}

@Component({
    imports: [DateTimePickerComponent, FormField],
    template: `<mona-datetime-picker [formField]="form.value" format="dd/MM/yyyy HH:mm"></mona-datetime-picker>`
})
class DateTimePickerHostComponent {
    readonly #model = signal<DateTimePickerFormModel>({ value: new Date(2026, 0, 2, 9, 30) });

    public readonly disabled = signal(false);
    public readonly form = form(this.#model, schema => {
        disabled(schema.value, { when: () => this.disabled() });
        readonly(schema.value, { when: () => this.readonly() });
    });
    public readonly readonly = signal(false);
}
