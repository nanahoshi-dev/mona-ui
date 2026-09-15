import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { DatePickerComponent } from "./date-picker.component";

@Component({
    template: `
        <mona-date-picker
            [(value)]="value"
            [format]="format()">
        </mona-date-picker>
    `,
    imports: [DatePickerComponent]
})
class DatePickerI18nTestHostComponent {
    public readonly format = signal("d MMMM yyyy");
    public readonly value = signal<Date | null>(new Date(2026, 8, 9));
}

const TR_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "tr-TR",
    messages: {
        datePicker: {
            datePicker: "Tarih seçici",
            openCalendar: "Takvimi aç"
        }
    }
};

const DE_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "de-DE",
    messages: {
        datePicker: {
            datePicker: "Datumsauswahl",
            openCalendar: "Kalender öffnen"
        }
    }
};

describe("DatePickerComponent i18n", () => {
    it("formats and parses date strings with active locale names and updates reactively on locale switch", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerI18nTestHostComponent]
        });
        const fixture: ComponentFixture<DatePickerI18nTestHostComponent> =
            TestBed.createComponent(DatePickerI18nTestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. en-US default: September
        expect(input.value).toBe("9 September 2026");

        // 2. Switch to tr-TR: September is Eylül in Turkish
        i18n.use(TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("9 Eylül 2026");

        // 3. Type a localized date in Turkish and blur: 15 Ekim 2026 (October 15, 2026)
        input.value = "15 Ekim 2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(9); // 0-indexed month 9 is October
        expect(parsedDate?.getDate()).toBe(15);

        // 4. Switch to de-DE: October is Oktober in German
        i18n.use(DE_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15 Oktober 2026");
    });

    it("handles complex BCP-47 Unicode extensions without errors and preserves Gregorian dates", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerI18nTestHostComponent]
        });
        const fixture = TestBed.createComponent(DatePickerI18nTestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.componentInstance.format.set("yyyy-MM-dd");
        fixture.componentInstance.value.set(new Date(2026, 8, 10));
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. en-US-u-ca-persian-nu-arab
        i18n.use({ id: "en-US-u-ca-persian-nu-arab", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBeTruthy();

        // 2. ar-SA-u-ca-islamic-umalqura-nu-arab
        i18n.use({ id: "ar-SA-u-ca-islamic-umalqura-nu-arab", direction: "rtl", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBeTruthy();

        // 3. fa-IR-u-nu-latn-ca-persian
        i18n.use({ id: "fa-IR-u-nu-latn-ca-persian", direction: "rtl", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-09-10");

        // Verify model date remains Gregorian 2026-09-10
        const date = fixture.componentInstance.value();
        expect(date?.getFullYear()).toBe(2026);
        expect(date?.getMonth()).toBe(8);
        expect(date?.getDate()).toBe(10);
    });

    it("derives locale-native default date format (e.g. ja-JP yyyy/MM/dd) and updates reactively without explicit format", async () => {
        @Component({
            template: `<mona-date-picker [(value)]="value" />`,
            imports: [DatePickerComponent]
        })
        class DefaultFormatTestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
        }

        TestBed.configureTestingModule({
            imports: [DefaultFormatTestHostComponent]
        });
        const fixture = TestBed.createComponent(DefaultFormatTestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. Default en-US: MM/dd/yyyy
        expect(input.value).toBe("09/15/2026");

        // 2. Switch to ja-JP: yyyy/MM/dd
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/09/15");

        // 3. Parse user input in Japanese format: 2026/10/20
        input.value = "2026/10/20";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(9); // 0-indexed month 9 is October
        expect(parsedDate?.getDate()).toBe(20);

        // 4. Switch to de-DE: dd.MM.yyyy
        i18n.use({ id: "de-DE", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("20.10.2026");
    });

    it("preserves explicit format regardless of locale switches", async () => {
        @Component({
            template: `<mona-date-picker [(value)]="value" [format]="'yyyy-MM-dd'" />`,
            imports: [DatePickerComponent]
        })
        class ExplicitFormatTestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
        }

        TestBed.configureTestingModule({
            imports: [ExplicitFormatTestHostComponent]
        });
        const fixture = TestBed.createComponent(ExplicitFormatTestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        expect(input.value).toBe("2026-09-15");

        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-09-15");

        i18n.use({ id: "de-DE", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-09-15");
    });
});
