import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePickerComponent } from "./date-picker.component";

@Component({
    template: `
        <label for="start-date">Start date</label>
        <mona-date-picker inputId="start-date" showClearButton [formField]="form.date"></mona-date-picker>
        <button type="button" id="outside">Outside</button>
    `,
    imports: [DatePickerComponent, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ date: Date | null }>({ date: new Date(2025, 2, 4) });
    public readonly form = form(this.#model);
}

@Component({
    template: `<mona-date-picker
        aria-label="Delivery date"
        [disabledDates]="disabledDates()"
        [max]="max()"
        [(value)]="value"></mona-date-picker>`,
    imports: [DatePickerComponent]
})
class LimitsHostComponent {
    public readonly disabledDates = signal<((date: Date) => boolean) | undefined>(undefined);
    public readonly max = signal<Date | undefined>(undefined);
    public readonly value = signal<Date | null>(new Date(2025, 2, 4));
}

@Component({
    template: `<mona-date-picker
        aria-label="Due date"
        aria-describedby="due-hint"
        readonly
        weekNumber
        [value]="value"></mona-date-picker>
        <p id="due-hint">Pick a weekday.</p>`,
    imports: [DatePickerComponent]
})
class LabelledHostComponent {
    public readonly value = new Date(2025, 2, 4);
}

async function create<T>(type: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-date-picker") as HTMLElement;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return getHost(fixture).querySelector("input") as HTMLInputElement;
}

function getPicker(fixture: ComponentFixture<unknown>): DatePickerComponent {
    return fixture.debugElement.query(debug => debug.componentInstance instanceof DatePickerComponent)
        .componentInstance as DatePickerComponent;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function type(fixture: ComponentFixture<unknown>, text: string): HTMLInputElement {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
}

async function typeAndBlur(fixture: ComponentFixture<unknown>, text: string): Promise<HTMLInputElement> {
    const input = type(fixture, text);
    input.dispatchEvent(new FocusEvent("blur"));
    await stable(fixture);
    return input;
}

function day(date: Date | null | undefined): string | null {
    return date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : null;
}

describe("DatePickerComponent interaction", () => {
    afterEach(() => {
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    describe("typed text", () => {
        it("accepts one-digit days and months and shows the date in the input format", async () => {
            const fixture = await create(FormHostComponent);

            const input = await typeAndBlur(fixture, "1/5/2025");

            expect(day(fixture.componentInstance.form.date().value())).toBe("2025-1-5");
            expect(input.value).toBe("01/05/2025");
        });

        it("reads a two-digit year in this century", async () => {
            const fixture = await create(FormHostComponent);

            await typeAndBlur(fixture, "01/05/25");

            expect(day(fixture.componentInstance.form.date().value())).toBe("2025-1-5");
        });

        it("keeps the value and the text when the text isn't a date, and reports a parse error", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.date;

            const input = await typeAndBlur(fixture, "02/30/2025");

            expect(day(field().value())).toBe("2025-3-4");
            expect(input.value).toBe("02/30/2025");
            expect(input.getAttribute("aria-invalid")).toBe("true");
            expect(field().errors().map(error => error.kind)).toEqual(["parse"]);

            await typeAndBlur(fixture, "03/05/2025");
            expect(day(field().value())).toBe("2025-3-5");
            expect(field().errors()).toEqual([]);
            expect(input.hasAttribute("aria-invalid")).toBe(false);
        });

        it("marks a date after max invalid instead of setting it", async () => {
            const fixture = await create(LimitsHostComponent, host => host.max.set(new Date(2025, 11, 31)));

            const input = await typeAndBlur(fixture, "06/01/2026");

            expect(day(fixture.componentInstance.value())).toBe("2025-3-4");
            expect(input.value).toBe("06/01/2026");
            expect(input.getAttribute("aria-invalid")).toBe("true");
        });

        it("marks a disabled date invalid instead of setting it", async () => {
            const fixture = await create(LimitsHostComponent, host =>
                host.disabledDates.set(date => date.getDay() === 0)
            );

            // March 9, 2025 is a Sunday.
            const input = await typeAndBlur(fixture, "03/09/2025");

            expect(day(fixture.componentInstance.value())).toBe("2025-3-4");
            expect(input.getAttribute("aria-invalid")).toBe("true");

            await typeAndBlur(fixture, "03/10/2025");
            expect(day(fixture.componentInstance.value())).toBe("2025-3-10");
            expect(input.hasAttribute("aria-invalid")).toBe(false);
        });

        it("commits on Enter, but not while an IME is composing", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.date;
            const input = type(fixture, "05/01/2025");

            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, isComposing: true, key: "Enter" }));
            await stable(fixture);
            expect(day(field().value())).toBe("2025-3-4");

            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
            await stable(fixture);
            expect(day(field().value())).toBe("2025-5-1");
        });

        it("clears the value as soon as the clear button is pressed", async () => {
            const fixture = await create(FormHostComponent);

            (getHost(fixture).querySelector("button[aria-label='Clear']") as HTMLButtonElement).click();
            await stable(fixture);

            expect(fixture.componentInstance.form.date().value()).toBeNull();
        });
    });

    describe("forms", () => {
        it("marks the field touched only when focus leaves the picker and its popup", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.date;
            const input = getInput(fixture);

            await typeAndBlur(fixture, "1/6/2025");
            expect(field().touched()).toBe(false);

            (getHost(fixture).querySelector("button[aria-label='Open calendar']") as HTMLButtonElement).click();
            await stable(fixture);
            const popup = document.querySelector("div[role='dialog']") as HTMLElement;
            input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: popup }));
            await stable(fixture);
            expect(field().touched()).toBe(false);

            input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            await stable(fixture);
            expect(field().touched()).toBe(true);
        });

        it("marks the field touched when focus leaves from inside the popup", async () => {
            vi.useFakeTimers();
            try {
                const fixture = await create(FormHostComponent);
                const field = fixture.componentInstance.form.date;
                const toggle = getHost(fixture).querySelector("button[aria-label='Open calendar']") as HTMLButtonElement;

                toggle.click();
                await stable(fixture);
                (document.getElementById("outside") as HTMLButtonElement).focus();
                toggle.click();
                await vi.runAllTimersAsync();
                await stable(fixture);

                expect(field().touched()).toBe(true);
                expect(document.activeElement?.id).toBe("outside");
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("accessibility", () => {
        it("labels the input through inputId and keeps the combobox state on it", async () => {
            const fixture = await create(FormHostComponent);
            const input = getInput(fixture);

            expect(input.id).toBe("start-date");
            expect(input.getAttribute("role")).toBe("combobox");
            expect(input.getAttribute("aria-expanded")).toBe("false");
            expect(input.getAttribute("aria-haspopup")).toBe("dialog");

            const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("passes aria-label and aria-describedby to the input, not the host", async () => {
            const fixture = await create(LabelledHostComponent);
            const input = getInput(fixture);

            expect(input.getAttribute("aria-label")).toBe("Due date");
            expect(input.getAttribute("aria-describedby")).toBe("due-hint");
            expect(getHost(fixture).hasAttribute("aria-label")).toBe(false);

            const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("accepts bare boolean attributes and still takes focus when read-only", async () => {
            const fixture = await create(LabelledHostComponent);
            const input = getInput(fixture);
            const focusSpy = vi.spyOn(input, "focus");

            expect(input.readOnly).toBe(true);
            getPicker(fixture).focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        });

        it("leaves the caret where a click in the text put it", async () => {
            const fixture = await create(FormHostComponent);
            const input = getInput(fixture);
            input.focus();
            input.setSelectionRange(2, 2);

            input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

            expect(input.selectionStart).toBe(2);
        });
    });
});
