import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { CalendarComponent } from "./calendar.component";

@Component({
    template: `<mona-calendar></mona-calendar>`,
    imports: [CalendarComponent]
})
class CalendarTestHostComponent {}

const TR_LOCALE: MonaLocale = {
    id: "tr-TR",
    direction: "ltr",
    messages: {
        calendar: {
            calendarLabel: (m: string) => `Takvim, ${m}`,
            yearViewLabel: (y: string) => `Yıl görünümü, ${y}`,
            decadeViewLabel: (s: number, e: number) => `On yıl görünümü, ${s} - ${e}`,
            nextMonth: "Sonraki ay",
            nextYear: "Sonraki yıl",
            nextDecade: "Sonraki on yıl",
            previousMonth: "Önceki ay",
            previousYear: "Önceki yıl",
            previousDecade: "Önceki on yıl",
            today: "Bugün",
            goToToday: (d: string) => `Bugüne git, ${d}`,
            switchToYearView: (m: string) => `Yıl görünümüne geç, geçerli ${m}`,
            switchToDecadeView: (y: string) => `On yıl görünümüne geç, geçerli ${y}`,
            decadeRange: (s: number, e: number) => `${s} ile ${e} arası`,
            yearCellLabel: (y: number) => `Yıl ${y}`
        }
    }
};

const DE_LOCALE: MonaLocale = {
    id: "de-DE",
    direction: "ltr",
    messages: {
        calendar: {
            calendarLabel: (m: string) => `Kalender, ${m}`,
            yearViewLabel: (y: string) => `Jahresansicht, ${y}`,
            decadeViewLabel: (s: number, e: number) => `Dekadenansicht, ${s} - ${e}`,
            nextMonth: "Nächster Monat",
            nextYear: "Nächstes Jahr",
            nextDecade: "Nächste Dekade",
            previousMonth: "Vorheriger Monat",
            previousYear: "Vorheriges Jahr",
            previousDecade: "Vorherige Dekade",
            today: "Heute",
            goToToday: (d: string) => `Zu heute springen, ${d}`,
            switchToYearView: (m: string) => `Zur Jahresansicht wechseln, aktuell ${m}`,
            switchToDecadeView: (y: string) => `Zur Dekadenansicht wechseln, aktuell ${y}`,
            decadeRange: (s: number, e: number) => `${s} bis ${e}`,
            yearCellLabel: (y: number) => `Jahr ${y}`
        }
    }
};

describe("CalendarComponent i18n", () => {
    it("updates labels, weekdays, and months reactively on runtime locale switch without recreating the fixture", async () => {
        TestBed.configureTestingModule({});
        const fixture: ComponentFixture<CalendarTestHostComponent> = TestBed.createComponent(CalendarTestHostComponent);
        const i18nService = TestBed.inject(MonaI18nService);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. English default checks
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Today");

        const prevButton = hostEl.querySelector('button[aria-label*="Previous"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label*="Next"]') as HTMLButtonElement;
        expect(prevButton.getAttribute("aria-label")).toBe("Previous month");
        expect(nextButton.getAttribute("aria-label")).toBe("Next month");

        const getWeekdayHeaders = () => {
            const headerRow = hostEl.querySelectorAll("div[style*='grid-template-columns']")[0];
            return Array.from(headerRow.querySelectorAll("div"))
                .map(el => el.textContent?.trim())
                .filter(Boolean);
        };

        expect(getWeekdayHeaders()).toContain("Mon");
        expect(getWeekdayHeaders()).toContain("Sun");

        // 2. Switch to tr-TR
        i18nService.use(TR_LOCALE);
        fixture.detectChanges();

        expect(todayButton.textContent?.trim()).toBe("Bugün");
        expect(prevButton.getAttribute("aria-label")).toBe("Önceki ay");
        expect(nextButton.getAttribute("aria-label")).toBe("Sonraki ay");

        expect(getWeekdayHeaders()).toContain("Pzt");
        expect(getWeekdayHeaders()).toContain("Paz");

        // 3. Switch to de-DE
        i18nService.use(DE_LOCALE);
        fixture.detectChanges();

        expect(todayButton.textContent?.trim()).toBe("Heute");
        expect(prevButton.getAttribute("aria-label")).toBe("Vorheriger Monat");
        expect(nextButton.getAttribute("aria-label")).toBe("Nächster Monat");

        expect(getWeekdayHeaders()).toContain("Mo");
        expect(getWeekdayHeaders()).toContain("So");
    });
});
