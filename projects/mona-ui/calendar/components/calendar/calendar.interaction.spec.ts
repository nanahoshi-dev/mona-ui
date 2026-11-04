import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarSelection } from "../../models/CalendarSelection";
import { CalendarComponent } from "./calendar.component";

@Component({
    template: `
        <button id="before" type="button">Before</button>
        <mona-calendar
            [disabled]="disabled()"
            [disabledDates]="disabledDates()"
            [focusOnMount]="focusOnMount()"
            [maxDate]="maxDate()"
            [minDate]="minDate()"
            [selection]="selection()"
            [(value)]="value"></mona-calendar>
    `,
    imports: [CalendarComponent]
})
class CalendarHostComponent {
    public readonly disabled = signal(false);
    public readonly disabledDates = signal<((date: Date) => boolean) | Date[] | null>(null);
    public readonly focusOnMount = signal(false);
    public readonly maxDate = signal<Date | null>(null);
    public readonly minDate = signal<Date | null>(null);
    public readonly selection = signal<CalendarSelection>("single");
    public readonly value = signal<Date | Date[] | null>(new Date(2023, 8, 16));
}

@Component({
    template: `<mona-calendar [formField]="form.date"></mona-calendar>`,
    imports: [CalendarComponent, FormField]
})
class FormCalendarHostComponent {
    readonly #model = signal<{ date: Date | Date[] | null }>({ date: new Date(2023, 8, 16) });
    public readonly form = form(this.#model);
}

@Component({
    template: `<mona-calendar weekNumber readonly [value]="value"></mona-calendar>`,
    imports: [CalendarComponent]
})
class BareAttributeHostComponent {
    public readonly value = new Date(2023, 8, 16);
}

async function create<T>(type: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getCalendar(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-calendar") as HTMLElement;
}

/** A day of September 2023, found by its full-date name (days near the edges also show for the next month). */
function getDay(fixture: ComponentFixture<unknown>, day: number): HTMLElement {
    const cell = getCalendar(fixture).querySelector<HTMLElement>(`[monaMonthDay][aria-label*='September ${day}, 2023']`);
    if (!cell) {
        throw new Error(`Day ${day} was not rendered.`);
    }
    return cell;
}

function getFocusedDay(fixture: ComponentFixture<unknown>): HTMLElement {
    return getCalendar(fixture).querySelector("[monaMonthDay][tabindex='0']") as HTMLElement;
}

function getButton(fixture: ComponentFixture<unknown>, label: string): HTMLButtonElement {
    const button = Array.from(getCalendar(fixture).querySelectorAll("button")).find(b =>
        b.getAttribute("aria-label")?.startsWith(label)
    );
    if (!button) {
        throw new Error(`Button ${label} was not rendered.`);
    }
    return button;
}

function key(target: HTMLElement, keyName: string, init: KeyboardEventInit = {}): void {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init }));
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

/** Lets the calendar's deferred focus move (it waits a tick for the view to render). */
async function settleFocus(fixture: ComponentFixture<unknown>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve));
    await stable(fixture);
}

async function axeViolations(element: HTMLElement): Promise<string[]> {
    const results = await axe.run(element, { rules: { region: { enabled: false } } });
    return results.violations.map(violation => violation.id);
}

describe("CalendarComponent interaction", () => {
    afterEach(() => {
        vi.useRealTimers();
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
    });

    describe("focus", () => {
        it("leaves focus where it is when an inline calendar renders", async () => {
            const before = document.createElement("button");
            document.body.appendChild(before);
            before.focus();

            const fixture = await create(CalendarHostComponent);
            await settleFocus(fixture);

            expect(document.activeElement).toBe(before);
            expect(getCalendar(fixture).hasAttribute("tabindex")).toBe(false);
            before.remove();
        });

        it("moves focus to the active day on render with focusOnMount", async () => {
            const fixture = await create(CalendarHostComponent, host => host.focusOnMount.set(true));
            await settleFocus(fixture);

            expect(document.activeElement).toBe(getDay(fixture, 16));
        });
    });

    describe("grid semantics", () => {
        it("lays the month view out as a grid of rows with column headers and named days", async () => {
            const fixture = await create(CalendarHostComponent);
            const grid = getCalendar(fixture).querySelector("[role='grid']") as HTMLElement;

            expect(grid).not.toBeNull();
            expect(getCalendar(fixture).hasAttribute("role")).toBe(false);
            // September 2023 spans five weeks (Aug 27 - Sep 30), plus the header row.
            expect(grid.querySelectorAll("[role='row']").length).toBe(6);
            expect(grid.querySelectorAll("[role='columnheader']").length).toBe(7);
            expect(grid.querySelectorAll("[role='gridcell']").length).toBe(35);

            const day = getDay(fixture, 16);
            expect(day.getAttribute("role")).toBe("gridcell");
            expect(day.getAttribute("aria-label")).toBe("Saturday, September 16, 2023");
            expect(day.getAttribute("aria-selected")).toBe("true");
            expect(getDay(fixture, 17).hasAttribute("aria-selected")).toBe(false);
            expect(await axeViolations(fixture.nativeElement as HTMLElement)).toEqual([]);
        });

        it("names the year view's months in full and passes axe in the year and decade views", async () => {
            const fixture = await create(CalendarHostComponent);

            getButton(fixture, "Switch to year view").click();
            await stable(fixture);
            const september = getCalendar(fixture).querySelector("[monaYearMonth][tabindex='0']") as HTMLElement;
            expect(september.getAttribute("aria-label")).toBe("September 2023");
            expect(await axeViolations(fixture.nativeElement as HTMLElement)).toEqual([]);

            getButton(fixture, "Switch to decade view").click();
            await stable(fixture);
            expect(getCalendar(fixture).querySelectorAll("[role='grid'] > [role='row']").length).toBe(3);
            expect(await axeViolations(fixture.nativeElement as HTMLElement)).toEqual([]);
        });
    });

    describe("selection", () => {
        it("disables the Today button when today is out of range", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const fixture = await create(CalendarHostComponent, host => host.maxDate.set(yesterday));
            const todayButton = getButton(fixture, "Go to today");

            expect(todayButton.disabled).toBe(true);
            todayButton.click();
            await stable(fixture);
            expect(fixture.componentInstance.value()).toEqual(new Date(2023, 8, 16));
        });

        it("picks today at midnight with the Today button", async () => {
            const fixture = await create(CalendarHostComponent, host => host.value.set(null));

            getButton(fixture, "Go to today").click();
            await stable(fixture);

            const value = fixture.componentInstance.value() as Date;
            const today = new Date();
            expect(value.toDateString()).toBe(today.toDateString());
            expect([value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds()]).toEqual([
                0, 0, 0, 0
            ]);
        });

        it("picks a midnight date with the keyboard when there is no value yet", async () => {
            const fixture = await create(CalendarHostComponent, host => host.value.set(null));
            const focused = getFocusedDay(fixture);

            key(focused, "ArrowRight");
            key(focused, "Enter");
            await stable(fixture);

            const value = fixture.componentInstance.value() as Date;
            expect(value.getHours() + value.getMinutes() + value.getSeconds() + value.getMilliseconds()).toBe(0);
        });

        it("toggles a timed date off with Ctrl+click in multiple selection", async () => {
            const fixture = await create(CalendarHostComponent, host => {
                host.selection.set("multiple");
                host.value.set([new Date(2023, 8, 16, 10, 30)]);
            });
            expect(getDay(fixture, 16).getAttribute("aria-selected")).toBe("true");

            getDay(fixture, 16).dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
            await stable(fixture);

            expect(fixture.componentInstance.value()).toEqual([]);
            expect(getDay(fixture, 16).hasAttribute("aria-selected")).toBe(false);
        });

        it("selects exactly the days of a range whose ends carry times", async () => {
            const fixture = await create(CalendarHostComponent, host => {
                host.selection.set("range");
                host.value.set([new Date(2023, 8, 11, 8, 0), new Date(2023, 8, 15, 12, 0)]);
            });

            const selected = Array.from(getCalendar(fixture).querySelectorAll("[monaMonthDay][aria-selected='true']"));
            expect(selected.map(cell => cell.textContent?.trim())).toEqual(["11", "12", "13", "14", "15"]);
        });

        it("writes a range only once both ends are picked", async () => {
            const previous = [new Date(2023, 8, 1), new Date(2023, 8, 2)];
            const fixture = await create(CalendarHostComponent, host => {
                host.selection.set("range");
                host.value.set(previous);
            });

            getDay(fixture, 11).click();
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(previous);

            getDay(fixture, 14).click();
            await stable(fixture);
            expect((fixture.componentInstance.value() as Date[]).map(d => d.getDate())).toEqual([11, 14]);
        });
    });

    describe("keyboard", () => {
        it("moves across days disabled through disabledDates", async () => {
            const fixture = await create(CalendarHostComponent, host => {
                host.value.set(new Date(2023, 8, 15));
                host.disabledDates.set((date: Date) => date.getDay() === 0 || date.getDay() === 6);
            });

            key(getFocusedDay(fixture), "ArrowRight");
            await stable(fixture);
            const saturday = getFocusedDay(fixture);
            expect(saturday.textContent?.trim()).toBe("16");
            expect(saturday.getAttribute("aria-disabled")).toBe("true");

            key(saturday, "Enter");
            await stable(fixture);
            expect(fixture.componentInstance.value()).toEqual(new Date(2023, 8, 15));
        });

        it("still stops the arrows at the range bounds", async () => {
            const fixture = await create(CalendarHostComponent, host => host.maxDate.set(new Date(2023, 8, 16)));

            key(getFocusedDay(fixture), "ArrowRight");
            await stable(fixture);

            expect(getFocusedDay(fixture).textContent?.trim()).toBe("16");
        });

        it("moves a year with Shift+PageDown and Shift+PageUp", async () => {
            const fixture = await create(CalendarHostComponent);

            key(getFocusedDay(fixture), "PageDown", { shiftKey: true });
            await stable(fixture);
            expect(getFocusedDay(fixture).getAttribute("aria-label")).toBe("Monday, September 16, 2024");

            key(getFocusedDay(fixture), "PageUp", { shiftKey: true });
            await stable(fixture);
            expect(getFocusedDay(fixture).getAttribute("aria-label")).toBe("Saturday, September 16, 2023");
        });

        it("leaves arrow keys on the header buttons to the buttons", async () => {
            const fixture = await create(CalendarHostComponent);

            key(getButton(fixture, "Next month"), "ArrowRight");
            await stable(fixture);

            expect(getFocusedDay(fixture).textContent?.trim()).toBe("16");
        });

        it("disables the header buttons and takes every day out of the tab order when disabled", async () => {
            const fixture = await create(CalendarHostComponent, host => host.disabled.set(true));
            const buttons = Array.from(getCalendar(fixture).querySelectorAll("button"));

            expect(buttons.length).toBeGreaterThan(0);
            expect(buttons.every(button => button.disabled)).toBe(true);
            expect(getCalendar(fixture).querySelector("[tabindex='0']")).toBeNull();
        });
    });

    describe("forms", () => {
        it("marks the field touched only when focus leaves the calendar", async () => {
            const fixture = await create(FormCalendarHostComponent);
            const field = fixture.componentInstance.form.date;
            const day = getDay(fixture, 17);

            day.click();
            await stable(fixture);
            expect(field().value()).toEqual(new Date(2023, 8, 17));
            expect(field().touched()).toBe(false);

            day.dispatchEvent(
                new FocusEvent("focusout", { bubbles: true, relatedTarget: getButton(fixture, "Next month") })
            );
            await stable(fixture);
            expect(field().touched()).toBe(false);

            getDay(fixture, 17).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            await stable(fixture);
            expect(field().touched()).toBe(true);
        });

        it("accepts bare boolean attributes", async () => {
            const fixture = await create(BareAttributeHostComponent);
            const grid = getCalendar(fixture).querySelector("[role='grid']") as HTMLElement;

            expect(grid.getAttribute("aria-readonly")).toBe("true");
            // Week numbers add a column: 8 entries per row.
            expect((grid.querySelector("[role='row']") as HTMLElement).children.length).toBe(8);
        });
    });

    describe("today", () => {
        it("moves the current day on when focus enters the calendar the next day", async () => {
            vi.useFakeTimers({ toFake: ["Date"] });
            vi.setSystemTime(new Date(2023, 8, 16, 23, 59));
            const fixture = await create(CalendarHostComponent);
            expect(getDay(fixture, 16).getAttribute("aria-current")).toBe("date");

            vi.setSystemTime(new Date(2023, 8, 17, 0, 1));
            getCalendar(fixture).dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            await stable(fixture);

            expect(getDay(fixture, 16).hasAttribute("aria-current")).toBe(false);
            expect(getDay(fixture, 17).getAttribute("aria-current")).toBe("date");
        });
    });
});
