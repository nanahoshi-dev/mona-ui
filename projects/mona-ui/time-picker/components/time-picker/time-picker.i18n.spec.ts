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

    it("derives default format based on locale, hourFormat, and showSeconds", async () => {
        @Component({
            template: `
                <mona-time-picker
                    [(value)]="value"
                    [hourFormat]="hourFormat()"
                    [showSeconds]="showSeconds()" />
            `,
            imports: [TimePickerComponent]
        })
        class DefaultTimeHostComponent {
            public readonly hourFormat = signal<"12" | "24">("24");
            public readonly showSeconds = signal(false);
            public readonly value = signal<Date | null>(new Date(2026, 0, 1, 14, 30, 45));
        }

        TestBed.configureTestingModule({
            imports: [DefaultTimeHostComponent]
        });
        const fixture = TestBed.createComponent(DefaultTimeHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds
        expect(input.value).toBe("14:30");

        // 2. 24h with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("14:30:45");

        // 3. Switch to ja-JP in 12h mode without seconds: 午後02:30
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.componentInstance.hourFormat.set("12");
        fixture.componentInstance.showSeconds.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("午後02:30");

        // 4. ja-JP in 12h mode with seconds: 午後02:30:45
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("午後02:30:45");

        // 5. Parse Japanese 12h input: 午前09:15:00
        input.value = "午前09:15:00";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getHours()).toBe(9);
        expect(parsedDate?.getMinutes()).toBe(15);
        expect(parsedDate?.getSeconds()).toBe(0);
    });

    it("preserves explicit format override even if hourFormat or showSeconds differ", async () => {
        @Component({
            template: `
                <mona-time-picker
                    [(value)]="value"
                    [format]="'HH:mm'"
                    [hourFormat]="'12'"
                    [showSeconds]="true" />
            `,
            imports: [TimePickerComponent]
        })
        class OverrideHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 0, 1, 14, 30, 45));
        }

        TestBed.configureTestingModule({
            imports: [OverrideHostComponent]
        });
        const fixture = TestBed.createComponent(OverrideHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        expect(input.value).toBe("14:30");
    });
});
