import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    disabled as fieldDisabled,
    form,
    FormField,
    readonly as fieldReadonly,
    required
} from "@angular/forms/signals";
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { CalendarSelection } from "../../models/CalendarSelection";
import { calendarBaseThemeVariants, calendarMonthViewDayThemeVariants } from "../../styles/calendar.styles";
import { CalendarComponent } from "./calendar.component";

@Component({
    template: `
        <mona-calendar
            [disabledDates]="disabledDates()"
            [formField]="form.date"
            [maxDate]="maxDate()"
            [minDate]="minDate()"
            [selection]="selection()">
        </mona-calendar>
    `,
    imports: [CalendarComponent, FormField]
})
class SignalFormCalendarHostComponent {
    readonly #formModel = signal<CalendarFormModel>({ date: date("2023-09-16") });
    public readonly disabled = signal(false);
    public readonly disabledDates = signal<Date[]>([]);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.date, { when: () => this.disabled() });
        fieldReadonly(schema.date, { when: () => this.readonlyState() });
        required(schema.date, { when: () => this.requiredState() });
    });
    public readonly maxDate = signal<Date | null>(null);
    public readonly minDate = signal<Date | null>(null);
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly selection = signal<CalendarSelection>("single");
}

describe("CalendarComponent signal forms", () => {
    it("updates the signal form value from day clicks", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;

        clickDay(fixture, 17);
        await waitForStable(fixture);

        expect(valueDate(component)).toEqualCalendarDate("2023-09-17");
        expect(component.form.date().touched()).toBe(true);
    });

    it("updates the signal form value from the Today button", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;

        getTodayButton(fixture).click();
        await waitForStable(fixture);

        const selected = DateTime.fromJSDate(valueDate(component));
        expect(selected.hasSame(DateTime.now(), "day")).toBe(true);
        expect(component.form.date().touched()).toBe(true);
    });

    it("commits keyboard selection with Enter", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;

        dispatchCalendarKey(fixture, "ArrowRight");
        dispatchCalendarKey(fixture, "Enter");
        await waitForStable(fixture);

        expect(valueDate(component)).toEqualCalendarDate("2023-09-17");
        expect(component.form.date().touched()).toBe(true);
    });

    it("commits Ctrl selection in multiple mode", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("multiple");
        component.form.date().value.set([date("2023-09-16")]);
        await waitForStable(fixture);

        dispatchCalendarKey(fixture, "ArrowRight");
        dispatchCalendarKey(fixture, "Enter", { ctrlKey: true });
        await waitForStable(fixture);

        expect(valueDates(component)).toEqualCalendarDates(["2023-09-16", "2023-09-17"]);
        expect(component.form.date().touched()).toBe(true);
    });

    it("commits Shift selection in multiple mode", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("multiple");
        component.form.date().value.set([date("2023-09-16")]);
        await waitForStable(fixture);

        dispatchCalendarKey(fixture, "ArrowRight");
        dispatchCalendarKey(fixture, "Enter", { shiftKey: true });
        await waitForStable(fixture);

        expect(valueDates(component)).toEqualCalendarDates(["2023-09-16", "2023-09-17"]);
        expect(component.form.date().touched()).toBe(true);
    });

    it("commits Shift+Arrow extension in multiple mode", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("multiple");
        component.form.date().value.set([date("2023-09-16")]);
        await waitForStable(fixture);

        dispatchCalendarKey(fixture, "ArrowRight", { shiftKey: true });
        await waitForStable(fixture);

        expect(valueDates(component)).toEqualCalendarDates(["2023-09-16", "2023-09-17"]);
        expect(component.form.date().touched()).toBe(true);
    });

    it("previews a forward range from the pending start date to the hovered day", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("range");
        component.form.date().value.set(null);
        await waitForStable(fixture);

        clickDay(fixture, 16);
        dispatchDayPointerEnter(fixture, 18);
        await waitForStable(fixture);

        expect(valueDates(component)).toEqualCalendarDates(["2023-09-16", "2023-09-16"]);
        expectRangePreview(fixture, 16, false);
        expectRangePreview(fixture, 17, true);
        expect(getDay(fixture, 17).getAttribute("aria-selected")).toBeNull();
    });

    it("previews a backward range from the pending start date to the hovered day", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("range");
        component.form.date().value.set(null);
        await waitForStable(fixture);

        clickDay(fixture, 18);
        dispatchDayPointerEnter(fixture, 16);
        await waitForStable(fixture);

        expectRangePreview(fixture, 17, true);
        expect(getDay(fixture, 17).getAttribute("aria-selected")).toBeNull();
    });

    it("commits the final range selection and clears the hover preview", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selection.set("range");
        component.form.date().value.set(null);
        await waitForStable(fixture);

        clickDay(fixture, 16);
        dispatchDayPointerEnter(fixture, 18);
        clickDay(fixture, 18);
        await waitForStable(fixture);

        expect(valueDates(component)).toEqualCalendarDates(["2023-09-16", "2023-09-18"]);
        expect(getDay(fixture, 17).getAttribute("aria-selected")).toBe("true");
        expectRangePreview(fixture, 17, false);
    });

    it("does not apply range preview outside range selection mode", async () => {
        const fixture = await createFixture();

        clickDay(fixture, 16);
        dispatchDayPointerEnter(fixture, 18);
        await waitForStable(fixture);

        expectRangePreview(fixture, 17, false);
    });

    it("does not change value from mouse or keyboard selection when readonly", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.readonlyState.set(true);
        await waitForStable(fixture);

        clickDay(fixture, 17);
        dispatchCalendarKey(fixture, "ArrowRight");
        dispatchCalendarKey(fixture, "Enter");
        await waitForStable(fixture);

        expect(valueDate(component)).toEqualCalendarDate("2023-09-16");
        expect(component.form.date().touched()).toBe(false);
    });

    it("does not change value when disabled", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.disabled.set(true);
        await waitForStable(fixture);

        clickDay(fixture, 17);
        dispatchCalendarKey(fixture, "ArrowRight");
        dispatchCalendarKey(fixture, "Enter");
        await waitForStable(fixture);

        expect(valueDate(component)).toEqualCalendarDate("2023-09-16");
        expect(component.form.date().touched()).toBe(false);
        expect(getCalendar(fixture).getAttribute("tabindex")).toBe("-1");
    });

    it("reflects required invalid state on the host", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.requiredState.set(true);
        component.form.date().value.set(null);
        component.form.date().markAsTouched();
        await waitForStable(fixture);

        const calendar = getCalendar(fixture);
        expect(component.form.date().invalid()).toBe(true);
        expect(calendar.getAttribute("aria-invalid")).toBe("true");
        expect(calendar.getAttribute("data-invalid")).toBe("true");
        expect(calendar.getAttribute("data-required")).toBe("true");
        expect(calendar.className).toContain("data-[invalid='true']:border-error");
    });

    it("uses minDate and maxDate to disable out-of-range days and keep keyboard navigation in range", async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.minDate.set(date("2023-09-16"));
        component.maxDate.set(date("2023-09-18"));
        await waitForStable(fixture);

        expect(getDay(fixture, 15).getAttribute("aria-disabled")).toBe("true");
        clickDay(fixture, 15);
        dispatchCalendarKey(fixture, "ArrowLeft");
        dispatchCalendarKey(fixture, "Enter");
        await waitForStable(fixture);

        expect(valueDate(component)).toEqualCalendarDate("2023-09-16");
        expect(getFocusedDay(fixture).textContent?.trim()).toBe("16");
    });
});

async function createFixture(): Promise<ComponentFixture<SignalFormCalendarHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormCalendarHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormCalendarHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function clickDay(fixture: ComponentFixture<unknown>, day: number): void {
    getDay(fixture, day).click();
}

function date(value: string): Date {
    return DateTime.fromISO(value).toJSDate();
}

function dispatchCalendarKey(fixture: ComponentFixture<unknown>, key: string, options: KeyboardEventInit = {}): void {
    getCalendar(fixture).dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options })
    );
    fixture.detectChanges();
}

function dispatchDayPointerEnter(fixture: ComponentFixture<unknown>, day: number): void {
    getDay(fixture, day).dispatchEvent(new Event("pointerenter", { cancelable: true }));
    fixture.detectChanges();
}

function expectRangePreview(fixture: ComponentFixture<unknown>, day: number, previewed: boolean): void {
    const dayElement = getDay(fixture, day);
    const classTokens = dayElement.className.split(/\s+/);
    expect(dayElement.getAttribute("data-range-preview")).toBe(previewed ? "true" : null);
    if (previewed) {
        expect(classTokens).toContain("bg-active");
    } else {
        expect(classTokens).not.toContain("bg-active");
    }
}

describe("Calendar visual contract", () => {
    it("uses a raised neutral surface and primary only for committed dates", () => {
        const baseClasses = calendarBaseThemeVariants("mona")({
            disabled: false,
            readonly: false,
            rounded: "medium"
        }).split(/\s+/);
        const focusedClasses = calendarMonthViewDayThemeVariants("mona")({
            disabled: false,
            focused: true,
            outside: false,
            rangePreview: false,
            rounded: "medium",
            selected: false,
            today: false
        }).split(/\s+/);
        const selectedClasses = calendarMonthViewDayThemeVariants("mona")({
            disabled: false,
            focused: false,
            outside: false,
            rangePreview: false,
            rounded: "medium",
            selected: true,
            today: false
        }).split(/\s+/);

        expect(baseClasses).toContain("bg-surface-raised");
        expect(baseClasses).toContain("border-border");
        expect(focusedClasses).toContain("bg-hover");
        expect(focusedClasses).toContain("ring-focus-indicator/35");
        expect(focusedClasses).not.toContain("bg-accent");
        expect(selectedClasses).toContain("bg-primary");
        expect(selectedClasses).toContain("text-primary-foreground");
    });
});

function getCalendar(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;
}

function getDay(fixture: ComponentFixture<unknown>, day: number): HTMLElement {
    const dayElement = getDays(fixture).find(e => e.textContent?.trim() === day.toString());
    if (!dayElement) {
        throw new Error(`Calendar day ${day} was not rendered.`);
    }
    return dayElement;
}

function getDays(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("[monaMonthDay]")) as HTMLElement[];
}

function getFocusedDay(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("[monaMonthDay][tabindex='0']") as HTMLElement;
}

function getTodayButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll("button") as NodeListOf<HTMLButtonElement>).find(
        button => button.textContent?.trim() === "Today"
    ) as HTMLButtonElement;
}

function valueDate(component: SignalFormCalendarHostComponent): Date {
    const value = component.form.date().value();
    if (!(value instanceof Date)) {
        throw new Error(`Expected a single date value, received ${String(value)}.`);
    }
    return value;
}

function valueDates(component: SignalFormCalendarHostComponent): Date[] {
    const value = component.form.date().value();
    if (!Array.isArray(value)) {
        throw new Error(`Expected a date array value, received ${String(value)}.`);
    }
    return value;
}

expect.extend({
    toEqualCalendarDate(received: Date, expected: string) {
        const pass = DateTime.fromJSDate(received).hasSame(DateTime.fromISO(expected), "day");
        return {
            pass,
            message: () => `expected ${received.toISOString()} to equal calendar date ${expected}`
        };
    },
    toEqualCalendarDates(received: Date[], expected: string[]) {
        const receivedDates = received.map(e => DateTime.fromJSDate(e).toISODate());
        const pass = receivedDates.length === expected.length && receivedDates.every((e, i) => e === expected[i]);
        return {
            pass,
            message: () => `expected ${receivedDates.join(", ")} to equal ${expected.join(", ")}`
        };
    }
});

interface CalendarFormModel {
    date: Date | Date[] | null;
}

declare module "vitest" {
    interface Assertion<T> {
        toEqualCalendarDate(expected: string): T;
        toEqualCalendarDates(expected: string[]): T;
    }
}
