import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { type FirstDayOfWeek } from "@nanahoshi/mona-ui/calendar";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { DateTimePickerComponent } from "./datetime-picker.component";

describe("DateTimePickerComponent i18n", () => {
    it("derives default format based on locale, hourFormat, and showSeconds", async () => {
        @Component({
            template: `
                <mona-datetime-picker
                    [(value)]="value"
                    [hourFormat]="hourFormat()"
                    [showSeconds]="showSeconds()" />
            `,
            imports: [DateTimePickerComponent]
        })
        class DefaultDateTimeHostComponent {
            public readonly hourFormat = signal<"12" | "24">("24");
            public readonly showSeconds = signal(false);
            public readonly value = signal<Date | null>(new Date(2026, 0, 2, 14, 30, 45));
        }

        TestBed.configureTestingModule({
            imports: [DefaultDateTimeHostComponent]
        });
        const fixture: ComponentFixture<DefaultDateTimeHostComponent> =
            TestBed.createComponent(DefaultDateTimeHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

        // 1. en-US default (24h without seconds)
        expect(input.value).toBe("01/02/2026, 14:30");

        // 2. en-US with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("01/02/2026, 14:30:45");

        // 3. Switch to ja-JP in 24h mode
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.componentInstance.showSeconds.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/01/02 14:30");

        // 4. ja-JP in 12h mode without seconds: 2026/01/02 午後02:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/01/02 午後02:30");

        // 5. ja-JP in 12h mode with seconds: 2026/01/02 午後02:30:45
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/01/02 午後02:30:45");

        // 6. Parse Japanese 12h datetime input: 2026/03/15 午前09:15:00
        input.value = "2026/03/15 午前09:15:00";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(2);
        expect(parsedDate?.getDate()).toBe(15);
        expect(parsedDate?.getHours()).toBe(9);
        expect(parsedDate?.getMinutes()).toBe(15);
        expect(parsedDate?.getSeconds()).toBe(0);
    });

    it("preserves explicit format override even if hourFormat or showSeconds differ", async () => {
        @Component({
            template: `
                <mona-datetime-picker
                    [(value)]="value"
                    [format]="'yyyy-MM-dd HH:mm'"
                    [hourFormat]="'12'"
                    [showSeconds]="true" />
            `,
            imports: [DateTimePickerComponent]
        })
        class OverrideHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 0, 2, 14, 30, 45));
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
        expect(input.value).toBe("2026-01-02 14:30");
    });

    it("passes week start to calendar based on locale and supports explicit override", async () => {
        @Component({
            template: `
                <mona-datetime-picker
                    [firstDay]="firstDay()"
                    [(value)]="value" />
            `,
            imports: [DateTimePickerComponent]
        })
        class WeekStartHostComponent {
            public readonly firstDay = signal<FirstDayOfWeek | null>(null);
            public readonly value = signal<Date | null>(new Date(2026, 0, 15));
        }

        TestBed.configureTestingModule({
            imports: [WeekStartHostComponent]
        });
        const fixture = TestBed.createComponent(WeekStartHostComponent);
        const i18n = TestBed.inject(MonaI18nService);

        // Under ja-JP, default week start should be Sunday (0)
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();

        // Open popup to check calendar
        const toggleBtn = fixture.nativeElement.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };

        // Sunday is first in ja-JP
        expect(getFirstWeekday()).toBe("日");

        // Explicit override to monday
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();

        // Monday is first
        expect(getFirstWeekday()).toBe("月");
    });
});
