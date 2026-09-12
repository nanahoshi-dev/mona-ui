import { Component, signal } from "@angular/core";
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

    it("renders rtl:rotate-180 on header navigation chevron icons", () => {
        TestBed.configureTestingModule({});
        const fixture = TestBed.createComponent(CalendarTestHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const prevButton = hostEl.querySelector('button[aria-label*="Previous"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label*="Next"]') as HTMLButtonElement;

        expect(prevButton.querySelector("svg")?.getAttribute("class")).toContain("rtl:rotate-180");
        expect(nextButton.querySelector("svg")?.getAttribute("class")).toContain("rtl:rotate-180");
    });

    it("navigates days with ArrowLeft/Right according to DOM direction", async () => {
        @Component({
            template: `<mona-calendar [(value)]="value"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class TestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
        }

        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        });
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
        const getFocusedDay = () => calendarEl.querySelector("[monaMonthDay][tabindex='0']")?.textContent?.trim();

        expect(getFocusedDay()).toBe("15");

        // 1. In LTR DOM: ArrowLeft = prev (-1 day), ArrowRight = next (+1 day)
        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("14");

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("15");

        // 2. In RTL DOM: ArrowLeft = next (+1 day), ArrowRight = prev (-1 day)
        calendarEl.setAttribute("dir", "rtl");
        fixture.detectChanges();
        await fixture.whenStable();

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("16");

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("15");
    });

    it("navigates periods with Ctrl+ArrowLeft/Right according to DOM direction", async () => {
        @Component({
            template: `<mona-calendar [(value)]="value"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class TestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
        }

        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        });
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
        const getHeading = () => calendarEl.querySelector("[id$='-heading']")?.textContent?.trim();

        expect(getHeading()).toBe("September 2026");

        // In RTL DOM: Ctrl+ArrowLeft = next period ("next"), Ctrl+ArrowRight = prev period ("prev")
        calendarEl.setAttribute("dir", "rtl");
        fixture.detectChanges();
        await fixture.whenStable();

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", ctrlKey: true, bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getHeading()).toBe("October 2026");

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true, bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getHeading()).toBe("September 2026");
    });

    it("respects DOM direction over locale direction across mismatch scenarios", async () => {
        @Component({
            template: `<mona-calendar [(value)]="value"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class TestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
        }

        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        });
        const fixture = TestBed.createComponent(TestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
        const getFocusedDay = () => calendarEl.querySelector("[monaMonthDay][tabindex='0']")?.textContent?.trim();

        // RTL locale + LTR DOM -> ArrowLeft = prev (-1 day)
        i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
        calendarEl.setAttribute("dir", "ltr");
        fixture.detectChanges();
        await fixture.whenStable();

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("14");

        // LTR locale + RTL DOM -> ArrowLeft = next (+1 day)
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        calendarEl.setAttribute("dir", "rtl");
        fixture.detectChanges();
        await fixture.whenStable();

        calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        fixture.detectChanges();
        expect(getFocusedDay()).toBe("15");
    });

    it("enforces Gregorian output calendar across fa-IR, th-TH, and explicit u-ca-* extensions", async () => {
        @Component({
            template: `<mona-calendar [(value)]="value"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class TestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 4, 31));
        }

        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        });
        const fixture = TestBed.createComponent(TestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
        const getHeading = () => calendarEl.querySelector("[id$='-heading']")?.textContent?.trim();

        // 1. en-US default: May 2026
        expect(getHeading()).toBe("May 2026");

        // 2. fa-IR default: must describe Gregorian May 2026, never Persian month Khordad 1405
        i18n.use({ id: "fa-IR", direction: "rtl", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        const faHeading = getHeading();
        expect(faHeading).not.toContain("خرداد");
        expect(faHeading).not.toContain("۱۴۰۵");
        expect(faHeading).toContain("۲۰۲۶");

        // 3. th-TH: must describe Gregorian 2026, not Buddhist 2569
        i18n.use({ id: "th-TH", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        const thHeading = getHeading();
        expect(thHeading).not.toContain("2569");
        expect(thHeading).toContain("2026");

        // 4. en-US-u-ca-persian: extension must be overridden to Gregorian
        i18n.use({ id: "en-US-u-ca-persian", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("May 2026");

        // 5. en-US-u-ca-buddhist: extension must be overridden to Gregorian
        i18n.use({ id: "en-US-u-ca-buddhist", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("May 2026");

        // 6. Complex Unicode extensions with multiple keys and multi-subtag calendars
        i18n.use({ id: "en-US-u-ca-persian-nu-arab", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBeTruthy();

        i18n.use({ id: "ar-SA-u-ca-islamic-umalqura-nu-arab", direction: "rtl", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBeTruthy();

        i18n.use({ id: "fa-IR-u-nu-latn-ca-persian", direction: "rtl", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBeTruthy();

        // 7. Selected model Date remains unchanged
        expect(fixture.componentInstance.value()?.getFullYear()).toBe(2026);
        expect(fixture.componentInstance.value()?.getMonth()).toBe(4);
        expect(fixture.componentInstance.value()?.getDate()).toBe(31);
    });

    it("uses locale-native token ordering for built-in calendar labels (ja-JP, zh-CN, de-DE, en-US)", async () => {
        @Component({
            template: `<mona-calendar [(value)]="value"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class TestHostComponent {
            public readonly value = signal<Date | null>(new Date(2026, 4, 31));
        }

        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        });
        const fixture = TestBed.createComponent(TestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
        const getHeading = () => calendarEl.querySelector("[id$='-heading']")?.textContent?.trim();

        // ja-JP: Year before Month (2026年5月)
        i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("2026年5月");

        // zh-CN: Year before Month (2026年5月)
        i18n.use({ id: "zh-CN", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("2026年5月");

        // de-DE: Mai 2026
        i18n.use({ id: "de-DE", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("Mai 2026");

        // en-US: May 2026
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getHeading()).toBe("May 2026");
    });

    it("correctly calculates calendar grid boundaries for month ends falling on Sunday or Saturday", async () => {
        @Component({
            template: `
                <mona-calendar
                    [value]="value()"
                    [firstDay]="firstDay()">
                </mona-calendar>
            `,
            imports: [CalendarComponent]
        })
        class BoundaryHostComponent {
            public readonly value = signal<Date>(new Date(2026, 4, 15)); // May 2026 (ends Sunday May 31)
            public readonly firstDay = signal<"sunday" | "monday">("sunday");
        }

        TestBed.configureTestingModule({
            imports: [BoundaryHostComponent]
        });
        const fixture = TestBed.createComponent(BoundaryHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const getDayCells = () =>
            Array.from(fixture.nativeElement.querySelectorAll("[monaMonthDay]")) as HTMLElement[];

        // 1. May 2026 with firstDay="sunday": May 31 is Sunday (new row start), completed through Sat June 6 (42 cells)
        fixture.componentInstance.firstDay.set("sunday");
        fixture.componentInstance.value.set(new Date(2026, 4, 15));
        fixture.detectChanges();
        await fixture.whenStable();

        let cells = getDayCells();
        expect(cells.length).toBe(42);
        expect(cells[0].textContent?.trim()).toBe("26"); // Sun Apr 26
        expect(cells[35].textContent?.trim()).toBe("31"); // Sun May 31 (start of 6th row)
        expect(cells[41].textContent?.trim()).toBe("6"); // Sat Jun 6 (end of 6th row)

        // 2. May 2026 with firstDay="monday": May 31 is Sunday (row end), exactly 5 rows (35 cells, no redundant 6th row)
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();

        cells = getDayCells();
        expect(cells.length).toBe(35);
        expect(cells[0].textContent?.trim()).toBe("27"); // Mon Apr 27
        expect(cells[34].textContent?.trim()).toBe("31"); // Sun May 31 (end of 5th row)

        // 3. February 2027 (starts Monday Feb 1, ends Sunday Feb 28)
        // Monday-first: exact 4 rows (28 cells)
        fixture.componentInstance.value.set(new Date(2027, 1, 15));
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();

        cells = getDayCells();
        expect(cells.length).toBe(28);
        expect(cells[0].textContent?.trim()).toBe("1"); // Mon Feb 1
        expect(cells[27].textContent?.trim()).toBe("28"); // Sun Feb 28

        // Sunday-first: Feb 1 is Monday (Sun Jan 31 start), Feb 28 is Sunday (Sat Mar 6 end) -> 5 rows (35 cells)
        fixture.componentInstance.firstDay.set("sunday");
        fixture.detectChanges();
        await fixture.whenStable();

        cells = getDayCells();
        expect(cells.length).toBe(35);
        expect(cells[0].textContent?.trim()).toBe("31"); // Sun Jan 31
        expect(cells[28].textContent?.trim()).toBe("28"); // Sun Feb 28
        expect(cells[34].textContent?.trim()).toBe("6"); // Sat Mar 6
    });

    it("aligns ISO week numbers for Sunday-first rows to represent the majority of the row", async () => {
        @Component({
            template: `
                <mona-calendar
                    [value]="value()"
                    [firstDay]="firstDay()"
                    [weekNumber]="true">
                </mona-calendar>
            `,
            imports: [CalendarComponent]
        })
        class WeekNumberHostComponent {
            public readonly value = signal<Date>(new Date(2026, 0, 15)); // January 2026 (Jan 1 is Thursday)
            public readonly firstDay = signal<"sunday" | "monday">("sunday");
        }

        TestBed.configureTestingModule({
            imports: [WeekNumberHostComponent]
        });
        const fixture = TestBed.createComponent(WeekNumberHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const getWeekNumberTexts = () => {
            const grid = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[1] as HTMLElement;
            return Array.from(grid.children)
                .filter(el => !el.hasAttribute("monaMonthDay"))
                .map(el => el.textContent?.trim());
        };

        // 1. Sunday-first: Jan 1, 2026 is Thursday.
        // Row 1 (Sun Dec 28 - Sat Jan 3) contains Thu Jan 1 -> Week 1
        // Row 2 (Sun Jan 4 - Sat Jan 10) contains Thu Jan 8 -> Week 2
        fixture.componentInstance.firstDay.set("sunday");
        fixture.detectChanges();
        await fixture.whenStable();

        let weekNumbers = getWeekNumberTexts();
        expect(weekNumbers[0]).toBe("1");
        expect(weekNumbers[1]).toBe("2");

        // 2. Monday-first: Jan 1, 2026 is Thursday.
        // Row 1 (Mon Dec 29 - Sun Jan 4) -> Week 1
        // Row 2 (Mon Jan 5 - Sun Jan 11) -> Week 2
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();

        weekNumbers = getWeekNumberTexts();
        expect(weekNumbers[0]).toBe("1");
        expect(weekNumbers[1]).toBe("2");
    });

    describe("locale-derived week start", () => {
        @Component({
            template: `<mona-calendar [firstDay]="firstDay()"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class WeekStartTestHostComponent {
            public readonly firstDay = signal<"monday" | "sunday" | null>(null);
        }

        it("defaults to Sunday-first for ja-JP and aligns weekday headers", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headers = Array.from(headerRow.querySelectorAll("div")).map(el => el.textContent?.trim());
            expect(headers[0]).toBe("日");
            expect(headers[1]).toBe("月");
            expect(headers[6]).toBe("土");
        });

        it("defaults to Monday-first for de-DE", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "de-DE", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headers = Array.from(headerRow.querySelectorAll("div")).map(el => el.textContent?.trim());
            expect(headers[0]).toBe("Mo");
            expect(headers[6]).toBe("So");
        });

        it("preserves explicit firstDay override even when active locale differs", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
            fixture.componentInstance.firstDay.set("monday");
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headers = Array.from(headerRow.querySelectorAll("div")).map(el => el.textContent?.trim());
            expect(headers[0]).toBe("月");
            expect(headers[6]).toBe("日");
        });

        it("reactively switches from Monday-first to Sunday-first on runtime locale change without override", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "de-DE", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const getFirstWeekday = () => {
                const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
                return headerRow.querySelectorAll("div")[0]?.textContent?.trim();
            };

            expect(getFirstWeekday()).toBe("Mo");

            // Switch to Japanese
            i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getFirstWeekday()).toBe("日");
        });
    });
});
