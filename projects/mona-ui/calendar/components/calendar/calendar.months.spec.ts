import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import type { CalendarSelection } from "../../models/CalendarSelection";
import { CalendarComponent } from "./calendar.component";

@Component({
    template: `
        <mona-calendar [months]="months()" [selection]="selection()" [weekNumber]="weekNumber()" [(value)]="value" />
    `,
    imports: [CalendarComponent]
})
class MonthsHostComponent {
    public readonly months = signal<number>(2);
    public readonly selection = signal<CalendarSelection>("single");
    public readonly value = signal<Date | Date[] | null>(date("2023-09-16"));
    public readonly weekNumber = signal(false);
}

describe("CalendarComponent with several months", () => {
    it("shows the months side by side, each grid named by its caption", async () => {
        const fixture = await createFixture();

        const grids = getGrids(fixture);
        expect(grids.map(grid => nameOf(grid))).toEqual(["September 2023", "October 2023"]);
        expect(headerText(fixture)).toBe("September – October 2023");
    });

    it("leaves the days of the months around each one blank, so every date is shown once", async () => {
        const fixture = await createFixture();

        const [september, october] = getGrids(fixture);
        expect(daysOf(september)).toHaveLength(30);
        expect(daysOf(october)).toHaveLength(31);
        const labels = getDays(fixture).map(day => day.getAttribute("aria-label"));
        expect(new Set(labels).size).toBe(labels.length);
        // September 2023 starts on a Friday, so its first week has five blank cells in a Sunday-first week.
        const firstWeek = september.querySelectorAll("[role='row']")[1];
        expect(
            Array.from(firstWeek.querySelectorAll("[role='gridcell']")).filter(cell => !cell.textContent?.trim())
        ).toHaveLength(5);
    });

    it("keeps one focusable day, in the month that holds the active date", async () => {
        const fixture = await createFixture();

        const focusable = getDays(fixture).filter(day => day.getAttribute("tabindex") === "0");
        expect(focusable.map(day => day.getAttribute("aria-label"))).toEqual(["Saturday, September 16, 2023"]);
    });

    it("moves the whole view by one month with the previous and next buttons", async () => {
        const fixture = await createFixture();

        getButton(fixture, "Next month").click();
        await stable(fixture);
        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["October 2023", "November 2023"]);
        expect(focusedDayLabel(fixture)).toBe("Monday, October 16, 2023");

        getButton(fixture, "Previous month").click();
        getButton(fixture, "Previous month").click();
        await stable(fixture);
        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["August 2023", "September 2023"]);
        expect(focusedDayLabel(fixture)).toBe("Wednesday, August 16, 2023");
    });

    it("lets the arrow keys cross into the next month, and moves the view only past the last one", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.value.set(date("2023-09-30"));
        await stable(fixture);

        pressKey(fixture, "ArrowRight");
        await stable(fixture);
        expect(focusedDayLabel(fixture)).toBe("Sunday, October 1, 2023");
        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["September 2023", "October 2023"]);

        pressKey(fixture, "End");
        pressKey(fixture, "ArrowDown");
        pressKey(fixture, "ArrowDown");
        pressKey(fixture, "ArrowDown");
        pressKey(fixture, "ArrowDown");
        await stable(fixture);
        expect(focusedDayLabel(fixture)).toBe("Saturday, November 4, 2023");
        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["October 2023", "November 2023"]);
    });

    it("opens a range that spans months on its first month", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.selection.set("range");
        fixture.componentInstance.value.set([date("2023-10-28"), date("2023-11-03")]);
        await stable(fixture);

        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["October 2023", "November 2023"]);
        expect(focusedDayLabel(fixture)).toBe("Friday, November 3, 2023");
    });

    it("shows the end of a range longer than the months shown", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.selection.set("range");
        fixture.componentInstance.value.set([date("2023-07-10"), date("2023-11-03")]);
        await stable(fixture);

        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["October 2023", "November 2023"]);
    });

    it("draws a range's ends apart from the days between them", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.selection.set("range");
        fixture.componentInstance.value.set([date("2023-09-29"), date("2023-10-02")]);
        await stable(fixture);

        const parts = getDays(fixture)
            .filter(day => day.getAttribute("aria-selected") === "true")
            .map(day => [day.getAttribute("aria-label"), day.getAttribute("data-range")]);
        expect(parts).toEqual([
            ["Friday, September 29, 2023", "start"],
            ["Saturday, September 30, 2023", "middle"],
            ["Sunday, October 1, 2023", "middle"],
            ["Monday, October 2, 2023", "end"]
        ]);
        const start = getDay(fixture, "Friday, September 29, 2023").className.split(/\s+/);
        const middle = getDay(fixture, "Saturday, September 30, 2023").className.split(/\s+/);
        expect(start).toContain("bg-primary");
        expect(middle).not.toContain("bg-primary");
        expect(middle).toContain("bg-(--color-selected)");
        expect(middle).toContain("forced-colors:bg-[Highlight]!");
    });

    it("marks a one-day range as its start", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.selection.set("range");
        fixture.componentInstance.value.set([date("2023-09-29"), date("2023-09-29")]);
        await stable(fixture);

        expect(getDay(fixture, "Friday, September 29, 2023").getAttribute("data-range")).toBe("start");
    });

    it("leaves days outside a range unmarked, and the single selection without range parts", async () => {
        const fixture = await createFixture();

        expect(getDay(fixture, "Saturday, September 16, 2023").getAttribute("aria-selected")).toBe("true");
        expect(getDay(fixture, "Saturday, September 16, 2023").hasAttribute("data-range")).toBe(false);
    });

    it("puts the month picked in the year view first", async () => {
        const fixture = await createFixture();

        getButton(fixture, "Switch to year view, currently September – October 2023").click();
        await stable(fixture);
        const december = Array.from(root(fixture).querySelectorAll<HTMLElement>("[monaYearMonth]")).find(
            month => month.textContent?.trim() === "Dec"
        ) as HTMLElement;
        december.click();
        await stable(fixture);

        expect(getGrids(fixture).map(grid => nameOf(grid))).toEqual(["December 2023", "January 2024"]);
    });

    it("shows week numbers for every month", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.weekNumber.set(true);
        await stable(fixture);

        const [, october] = getGrids(fixture);
        const firstWeek = october.querySelectorAll("[role='row']")[1];
        expect(firstWeek.querySelector("[aria-hidden='true']")?.textContent?.trim()).toBe("40");
    });

    it("keeps whole months from 1 to 12", async () => {
        const fixture = await createFixture();

        fixture.componentInstance.months.set(0);
        await stable(fixture);
        expect(getGrids(fixture)).toHaveLength(1);

        fixture.componentInstance.months.set(20);
        await stable(fixture);
        expect(getGrids(fixture)).toHaveLength(12);

        fixture.componentInstance.months.set(2.7);
        await stable(fixture);
        expect(getGrids(fixture)).toHaveLength(2);
    });

    it("keeps a single month as before: no caption, the header names the grid, and days around it shown", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.months.set(1);
        await stable(fixture);

        const [grid] = getGrids(fixture);
        expect(nameOf(grid)).toBe("September 2023");
        expect(headerText(fixture)).toBe("September 2023");
        expect(daysOf(grid).length).toBe(35);
    });

    it("has no axe violations", async () => {
        const fixture = await createFixture();
        fixture.componentInstance.selection.set("range");
        fixture.componentInstance.value.set([date("2023-09-29"), date("2023-10-02")]);
        await stable(fixture);

        const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(results.violations).toEqual([]);
    });
});

async function createFixture(): Promise<ComponentFixture<MonthsHostComponent>> {
    await TestBed.configureTestingModule({ imports: [MonthsHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MonthsHostComponent);
    await stable(fixture);
    return fixture;
}

function root(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function date(value: string): Date {
    return DateTime.fromISO(value).toJSDate();
}

function daysOf(grid: HTMLElement): HTMLElement[] {
    return Array.from(grid.querySelectorAll<HTMLElement>("[monaMonthDay]"));
}

function focusedDayLabel(fixture: ComponentFixture<unknown>): string | null {
    const focusable = getDays(fixture).filter(day => day.getAttribute("tabindex") === "0");
    expect(focusable).toHaveLength(1);
    return focusable[0].getAttribute("aria-label");
}

function getButton(fixture: ComponentFixture<unknown>, label: string): HTMLButtonElement {
    const button = Array.from(root(fixture).querySelectorAll<HTMLButtonElement>("button")).find(
        candidate => normalizeSpaces(candidate.getAttribute("aria-label")) === label
    );
    if (!button) {
        throw new Error(`No button is labelled "${label}".`);
    }
    return button;
}

function getDay(fixture: ComponentFixture<unknown>, label: string): HTMLElement {
    const day = getDays(fixture).find(candidate => candidate.getAttribute("aria-label") === label);
    if (!day) {
        throw new Error(`No day is labelled "${label}".`);
    }
    return day;
}

function getDays(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(root(fixture).querySelectorAll<HTMLElement>("[monaMonthDay]"));
}

function getGrids(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(root(fixture).querySelectorAll<HTMLElement>("[role='grid']"));
}

function headerText(fixture: ComponentFixture<unknown>): string | undefined {
    return normalizeSpaces((fixture.nativeElement as HTMLElement).querySelector("[id$='-heading']")?.textContent);
}

/** The text of the element that names a grid through `aria-labelledby`. */
function nameOf(grid: HTMLElement): string | undefined {
    const id = grid.getAttribute("aria-labelledby") ?? "";
    return normalizeSpaces(grid.ownerDocument.getElementById(id)?.textContent);
}

/** Text with each run of white space, such as the thin spaces `Intl` puts around a range's dash, as one space. */
function normalizeSpaces(text: string | null | undefined): string | undefined {
    return text?.replace(/\s+/gu, " ").trim();
}

function pressKey(fixture: ComponentFixture<unknown>, key: string): void {
    const calendar = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
    calendar.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
}
