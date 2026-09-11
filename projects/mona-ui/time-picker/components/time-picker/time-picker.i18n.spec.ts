import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { TimePickerComponent } from "./time-picker.component";

@Component({
    template: `
        <mona-time-picker
            [(value)]="value"
            [format]="format()">
        </mona-time-picker>
    `,
    imports: [TimePickerComponent]
})
class TimePickerI18nTestHostComponent {
    public readonly format = signal("hh:mm a");
    public readonly value = signal<Date | null>(new Date(2026, 0, 1, 14, 30));
}

const TR_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "tr-TR",
    messages: {
        timePicker: {
            timePicker: "Saat seçici"
        }
    }
};

describe("TimePickerComponent i18n", () => {
    it("formats and parses time strings according to active locale and updates reactively", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerI18nTestHostComponent]
        });
        const fixture: ComponentFixture<TimePickerI18nTestHostComponent> =
            TestBed.createComponent(TimePickerI18nTestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. en-US default: 02:30 PM
        expect(input.value).toBe("02:30 PM");

        // 2. Switch to tr-TR: PM is ÖS in Turkish
        i18n.use(TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("02:30 ÖS");

        // 3. Type a localized time in Turkish: 09:15 ÖÖ (9:15 AM)
        input.value = "09:15 ÖÖ";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getHours()).toBe(9);
        expect(parsedDate?.getMinutes()).toBe(15);
    });
});
