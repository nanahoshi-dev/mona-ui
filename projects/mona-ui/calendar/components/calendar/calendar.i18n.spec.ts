import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { CalendarMonthCellTemplateDirective } from "../../directives/calendar-month-cell-template.directive";
import type { FirstDayOfWeek } from "../../models/FirstDayOfWeek";
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
            return Array.from(headerRow.querySelectorAll("span[aria-hidden='true']"))
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
        expect(getFocusedDay()).toBe("١٤");

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
            public readonly firstDay = signal<"sunday" | "monday">("sunday");
            public readonly value = signal<Date>(new Date(2026, 4, 15)); // May 2026 (ends Sunday May 31)
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
            public readonly firstDay = signal<FirstDayOfWeek>("sunday");
            public readonly value = signal<Date>(new Date(2026, 0, 15)); // January 2026 (Jan 1 is Thursday)
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

        // 3. Friday-first: Jan 1, 2026 is Thursday.
        // Row 1 (Fri Dec 26 - Thu Jan 1) contains Thu Jan 1 -> Week 1
        // Row 2 (Fri Jan 2 - Thu Jan 8) contains Thu Jan 8 -> Week 2
        fixture.componentInstance.firstDay.set("friday");
        fixture.detectChanges();
        await fixture.whenStable();

        weekNumbers = getWeekNumberTexts();
        expect(weekNumbers[0]).toBe("1");
        expect(weekNumbers[1]).toBe("2");
    });

    describe("locale-derived week start", () => {
        @Component({
            template: `<mona-calendar [firstDay]="firstDay()" [value]="value()"></mona-calendar>`,
            imports: [CalendarComponent]
        })
        class WeekStartTestHostComponent {
            public readonly firstDay = signal<FirstDayOfWeek | null>(null);
            public readonly value = signal<Date | null>(null);
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
            const headers = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el => el.textContent?.trim());
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
            const headers = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el => el.textContent?.trim());
            expect(headers[0]).toBe("Mo");
            expect(headers[6]).toBe("So");
        });

        it("defaults to Saturday-first for ar-EG and aligns weekday headers and month grid with compact labels", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            // ar-EG is a verified Saturday-first locale (firstDay: 6 in Intl.Locale.weekInfo and CLDR)
            i18n.use({ id: "ar-EG", direction: "rtl", messages: {} });
            fixture.componentInstance.value.set(new Date(2026, 8, 15)); // September 15, 2026
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headerDivs = Array.from(headerRow.querySelectorAll(":scope > div"));
            const visibleHeaders = headerDivs.map(el => el.querySelector("span[aria-hidden='true']")?.textContent?.trim());
            const accessibleHeaders = headerDivs.map(el => el.querySelector("span.sr-only")?.textContent?.trim());
            expect(visibleHeaders[0]).toBe("س");
            expect(visibleHeaders[1]).toBe("ح");
            expect(visibleHeaders[6]).toBe("ج");
            expect(accessibleHeaders[0]).toBe("السبت");
            expect(accessibleHeaders[1]).toBe("الأحد");
            expect(accessibleHeaders[6]).toBe("الجمعة");
            headerDivs.forEach(el => expect(el.getAttribute("aria-label")).toBeNull());

            // Month grid alignment for September 2026:
            // Sep 1, 2026 is Tuesday. With Saturday start, row 1 contains:
            // Aug 29 (Sat), Aug 30 (Sun), Aug 31 (Mon), Sep 1 (Tue) ...
            // Sep 30, 2026 is Wednesday. Row 5 ends on Friday Oct 2.
            const gridDays = Array.from(fixture.nativeElement.querySelectorAll("[monaMonthDay]"))
                .map(el => (el as HTMLElement).textContent?.trim());
            expect(gridDays[0]).toBe("٢٩");
            expect(gridDays[gridDays.length - 1]).toBe("٢");
        });

        it("defaults to Sunday-first for ar-SA and displays compact narrow weekday headers with full accessible labels", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headerDivs = Array.from(headerRow.querySelectorAll(":scope > div"));
            const visibleSpans = headerDivs.map(el => el.querySelector("span[aria-hidden='true']"));
            const srOnlySpans = headerDivs.map(el => el.querySelector("span.sr-only"));

            expect(visibleSpans.map(s => s?.textContent?.trim())).toEqual(["ح", "ن", "ث", "ر", "خ", "ج", "س"]);
            visibleSpans.forEach(s => expect(s?.getAttribute("aria-hidden")).toBe("true"));
            expect(srOnlySpans.map(s => s?.textContent?.trim())).toEqual(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]);
            headerDivs.forEach(el => expect(el.getAttribute("aria-label")).toBeNull());
        });

        it("ensures weekday header elements have no aria-prohibited-attr violations", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const results = await axe.run(headerRow, {
                runOnly: {
                    type: "rule",
                    values: ["aria-prohibited-attr"]
                }
            });
            expect(results.violations).toEqual([]);
        });

        it("retains compact weekday headers across all official locales without overflow", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);

            const testCases = [
                { id: "en-US", expected: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
                { id: "de-DE", expected: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] },
                { id: "es-ES", expected: ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] },
                { id: "fr-FR", expected: ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."] },
                { id: "ja-JP", expected: ["日", "月", "火", "水", "木", "金", "土"] },
                { id: "ko-KR", expected: ["일", "월", "화", "수", "목", "금", "토"] },
                { id: "pt-BR", expected: ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."] },
                { id: "it-IT", expected: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] },
                { id: "zh-CN", expected: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] },
                { id: "zh-TW", expected: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"] },
                { id: "ar-SA", expected: ["ح", "ن", "ث", "ر", "خ", "ج", "س"] }
            ];

            for (const { id, expected } of testCases) {
                i18n.use({ id, direction: id === "ar-SA" ? "rtl" : "ltr", messages: {} });
                fixture.detectChanges();
                await fixture.whenStable();

                const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
                const headers = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el => el.textContent?.trim());
                expect(headers).toEqual(expected);
            }
        });

        it("defaults to Friday-first for en-MV and aligns weekday headers and month grid", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            // en-MV is a verified Friday-first territory locale with stable English weekday names (firstDay: 5 in Intl.Locale.weekInfo and CLDR)
            i18n.use({ id: "en-MV", direction: "ltr", messages: {} });
            fixture.componentInstance.value.set(new Date(2026, 8, 15)); // September 15, 2026
            fixture.detectChanges();
            await fixture.whenStable();

            const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            const headers = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el => el.textContent?.trim());
            expect(headers[0]).toBe("Fri");
            expect(headers[6]).toBe("Thu");

            // Month grid alignment for September 2026:
            // Sep 1, 2026 is Tuesday. With Friday start, row 1 contains:
            // Aug 28 (Fri), Aug 29 (Sat), Aug 30 (Sun), Aug 31 (Mon), Sep 1 (Tue) ...
            // Sep 30, 2026 is Wednesday. Row 5 ends on Thursday Oct 1.
            const gridDays = Array.from(fixture.nativeElement.querySelectorAll("[monaMonthDay]"))
                .map(el => (el as HTMLElement).textContent?.trim());
            expect(gridDays[0]).toBe("28");
            expect(gridDays[gridDays.length - 1]).toBe("1");
        });

        it("navigates to start and end of week row via Home and End keys for monday, sunday, saturday, and friday-first calendars", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
            const getFocusedDay = () => calendarEl.querySelector("[monaMonthDay][tabindex='0']")?.textContent?.trim();

            // 1. Monday-first calendar: focus on Wednesday Sep 16, 2026
            // Week row is Mon Sep 14 to Sun Sep 20
            fixture.componentInstance.firstDay.set("monday");
            fixture.componentInstance.value.set(new Date(2026, 8, 16));
            fixture.detectChanges();
            await fixture.whenStable();
            expect(getFocusedDay()).toBe("16");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("14");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("20");

            // 2. Sunday-first calendar: focus on Wednesday Sep 16, 2026
            // Week row is Sun Sep 13 to Sat Sep 19
            fixture.componentInstance.firstDay.set("sunday");
            fixture.componentInstance.value.set(new Date(2026, 8, 16));
            fixture.detectChanges();
            await fixture.whenStable();
            expect(getFocusedDay()).toBe("16");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("13");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("19");

            // 3. Saturday-first calendar via ar-EG locale auto-derivation: focus on Wednesday Sep 16, 2026
            // Week row is Sat Sep 12 to Fri Sep 18
            i18n.use({ id: "ar-EG", direction: "rtl", messages: {} });
            fixture.componentInstance.firstDay.set(null); // Auto-derive from locale
            fixture.componentInstance.value.set(new Date(2026, 8, 16));
            fixture.detectChanges();
            await fixture.whenStable();
            expect(getFocusedDay()).toBe("١٦");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("١٢");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("١٨");

            // 4. Friday-first calendar via en-MV locale auto-derivation: focus on Wednesday Sep 16, 2026
            // Week row is Fri Sep 11 to Thu Sep 17
            i18n.use({ id: "en-MV", direction: "ltr", messages: {} });
            fixture.componentInstance.firstDay.set(null); // Auto-derive from locale
            fixture.componentInstance.value.set(new Date(2026, 8, 16));
            fixture.detectChanges();
            await fixture.whenStable();
            expect(getFocusedDay()).toBe("16");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("11");

            calendarEl.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(getFocusedDay()).toBe("17");
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
            const headers = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el => el.textContent?.trim());
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
                return headerRow.querySelector("span[aria-hidden='true']")?.textContent?.trim();
            };

            expect(getFirstWeekday()).toBe("Mo");

            // Switch to Japanese
            i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getFirstWeekday()).toBe("日");
        });

        it("prevents cache poisoning when activating whitespace-bearing locale before official ja-JP", async () => {
            TestBed.configureTestingModule({
                imports: [WeekStartTestHostComponent]
            });
            const fixture = TestBed.createComponent(WeekStartTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);

            const getFirstWeekday = () => {
                const headerRow = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
                return headerRow.querySelector("span[aria-hidden='true']")?.textContent?.trim();
            };

            // 1. Activate custom locale with whitespace in id
            i18n.use({ id: " ja-JP ", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getFirstWeekday()).toBe("日");

            // 2. Switch to official Japanese locale
            i18n.use({ id: "ja-JP", direction: "ltr", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            // First weekday must remain Sunday ("日")
            expect(getFirstWeekday()).toBe("日");
        });
    });

    describe("Numeral localization", () => {
        @Component({
            template: `
                <mona-calendar [value]="value()" [weekNumber]="weekNumber()">
                    @if (useCustomTemplate()) {
                        <ng-template monaCalendarMonthCellTemplate let-day let-date="date">
                            <span class="custom-cell">{{ day }}-{{ typeofDay(day) }}</span>
                        </ng-template>
                    }
                </mona-calendar>
            `,
            imports: [CalendarComponent, CalendarMonthCellTemplateDirective]
        })
        class NumeralTestHostComponent {
            public readonly useCustomTemplate = signal(false);
            public readonly value = signal<Date | null>(new Date(2026, 8, 15));
            public readonly weekNumber = signal(false);
            public typeofDay(val: unknown): string {
                return typeof val;
            }
        }

        it("renders Arabic-Indic numerals in month day cells, decade heading, and decade cells under ar-SA", async () => {
            TestBed.configureTestingModule({
                imports: [NumeralTestHostComponent]
            });
            const fixture = TestBed.createComponent(NumeralTestHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
            const focusedDay = calendarEl.querySelector("[monaMonthDay][tabindex='0']");
            expect(focusedDay?.textContent?.trim()).toBe("١٥");

            // Switch to decade view: click switch to year, then switch to decade
            const viewSwitchBtn = calendarEl.querySelectorAll("button")[1] as HTMLButtonElement;
            viewSwitchBtn.click();
            fixture.detectChanges();
            await fixture.whenStable();

            const decadeSwitchBtn = calendarEl.querySelectorAll("button")[1] as HTMLButtonElement;
            decadeSwitchBtn.click();
            fixture.detectChanges();
            await fixture.whenStable();

            // Decade heading: ٢٠٢٠ - ٢٠٢٩
            const heading = calendarEl.querySelector("button span.text-primary");
            expect(heading?.textContent?.trim()).toBe("٢٠٢٠ - ٢٠٢٩");

            // Decade cells: ٢٠٢٠ ... ٢٠٢٩
            const decadeCells = Array.from(calendarEl.querySelectorAll("div[monaDecadeYear]")).map(el => el.textContent?.trim());
            expect(decadeCells).toContain("٢٠٢٠");
            expect(decadeCells).toContain("٢٠٢٩");

            // Switch reactively back to en-US
            i18n.use(MONA_DEFAULT_LOCALE);
            fixture.detectChanges();
            await fixture.whenStable();

            expect(heading?.textContent?.trim()).toBe("2020 - 2029");
            const enDecadeCells = Array.from(calendarEl.querySelectorAll("div[monaDecadeYear]")).map(el => el.textContent?.trim());
            expect(enDecadeCells).toContain("2020");
            expect(enDecadeCells).toContain("2029");
        });

        it("renders Arabic-Indic numerals for week numbers when enabled", async () => {
            TestBed.configureTestingModule({
                imports: [NumeralTestHostComponent]
            });
            const fixture = TestBed.createComponent(NumeralTestHostComponent);
            fixture.componentInstance.weekNumber.set(true);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
            const monthGrid = calendarEl.querySelectorAll("div[style*='grid-template-columns']")[1] as HTMLElement;
            const weekDivs = Array.from(monthGrid.children).filter(el => !el.hasAttribute("monamonthday"));
            expect(weekDivs.length).toBeGreaterThan(0);
            const weekTexts = weekDivs.map(el => el.textContent?.trim());
            expect(weekTexts.some(t => /[٠-٩]/.test(t))).toBe(true);
            expect(weekTexts.some(t => /[0-9]/.test(t))).toBe(false);
        });

        it("preserves numeric type in custom template context even under ar-SA", async () => {
            TestBed.configureTestingModule({
                imports: [NumeralTestHostComponent]
            });
            const fixture = TestBed.createComponent(NumeralTestHostComponent);
            fixture.componentInstance.useCustomTemplate.set(true);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
            fixture.detectChanges();
            await fixture.whenStable();

            const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
            const customCells = calendarEl.querySelectorAll(".custom-cell");
            expect(customCells.length).toBeGreaterThan(0);
            expect(customCells[0].textContent).toContain("number");
        });
    });
});
