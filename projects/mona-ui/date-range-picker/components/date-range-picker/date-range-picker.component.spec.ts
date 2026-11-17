import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField, required } from "@angular/forms/signals";
import type { FirstDayOfWeek } from "@nanahoshi/mona-ui/calendar";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DateRange } from "../../models/DateRange";
import type { DateRangePreset, DateRangePresetKey } from "../../models/DateRangePreset";
import { DateRangePickerComponent } from "./date-range-picker.component";

@Component({
    template: `
        <mona-date-range-picker aria-label="Stay" showClearButton [formField]="form.stay"></mona-date-range-picker>
        <button type="button" id="outside">Outside</button>
    `,
    imports: [DateRangePickerComponent, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ stay: DateRange | null }>({
        stay: { end: new Date(2025, 2, 9), start: new Date(2025, 2, 4) }
    });
    public readonly form = form(this.#model, schema => required(schema.stay));
}

@Component({
    template: `<mona-date-range-picker
        aria-label="Trip"
        aria-describedby="trip-hint"
        [disabled]="disabled()"
        [disabledDates]="disabledDates()"
        [maxDate]="max()"
        [minDate]="min()"
        [readonly]="readonly()"
        [(value)]="value"></mona-date-range-picker>
        <p id="trip-hint">Up to two weeks.</p>`,
    imports: [DateRangePickerComponent]
})
class ValueHostComponent {
    public readonly disabled = signal(false);
    public readonly disabledDates = signal<((date: Date) => boolean) | undefined>(undefined);
    public readonly max = signal<Date | undefined>(undefined);
    public readonly min = signal<Date | undefined>(undefined);
    public readonly readonly = signal(false);
    public readonly value = signal<DateRange | null>(null);
}

@Component({
    template: `<mona-date-range-picker
        aria-label="Report"
        [firstDay]="firstDay()"
        [format]="format()"
        [maxDate]="max()"
        [minDate]="min()"
        [presets]="presets()"
        [startPlaceholder]="startPlaceholder()"
        [(value)]="value"></mona-date-range-picker>`,
    imports: [DateRangePickerComponent]
})
class PresetHostComponent {
    public readonly firstDay = signal<FirstDayOfWeek | null>("monday");
    public readonly format = signal<string | null>(null);
    public readonly max = signal<Date | undefined>(undefined);
    public readonly min = signal<Date | undefined>(undefined);
    public readonly presets = signal<readonly (DateRangePreset | DateRangePresetKey)[]>([
        "today",
        "last7Days",
        "thisWeek",
        "lastMonth"
    ]);
    public readonly startPlaceholder = signal("");
    public readonly value = signal<DateRange | null>(null);
}

@Component({
    template: `<mona-label text="Holiday"><mona-date-range-picker /></mona-label>`,
    imports: [DateRangePickerComponent, LabelComponent]
})
class WrappedHostComponent {}

async function create<T>(type: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-date-range-picker") as HTMLElement;
}

function getInputs(fixture: ComponentFixture<unknown>): [HTMLInputElement, HTMLInputElement] {
    const [start, end] = Array.from(getHost(fixture).querySelectorAll("input"));
    return [start, end];
}

function getToggle(fixture: ComponentFixture<unknown>): HTMLButtonElement {
    return getHost(fixture).querySelector("button[aria-label='Open calendar']") as HTMLButtonElement;
}

function getDialog(): HTMLElement | null {
    return document.querySelector("div[role='dialog']");
}

function getDay(label: string): HTMLElement {
    const dialog = getDialog();
    const dayElement = Array.from(dialog?.querySelectorAll<HTMLElement>("[monaMonthDay]") ?? []).find(
        candidate => candidate.getAttribute("aria-label") === label
    );
    if (!dayElement) {
        throw new Error(`No day is labelled "${label}".`);
    }
    return dayElement;
}

async function typeAndBlur(
    fixture: ComponentFixture<unknown>,
    input: HTMLInputElement,
    text: string
): Promise<HTMLInputElement> {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("blur"));
    await stable(fixture);
    return input;
}

function getPresets(): HTMLButtonElement[] {
    return Array.from(getDialog()?.querySelectorAll<HTMLButtonElement>("[aria-label='Quick ranges'] button") ?? []);
}

function getSizerTexts(fixture: ComponentFixture<unknown>): string[][] {
    return Array.from(getHost(fixture).querySelectorAll("span.invisible")).map(sizer =>
        Array.from(sizer.children).map(text => text.textContent ?? "")
    );
}

function day(date: Date | null | undefined): string | null {
    return date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : null;
}

function days(range: DateRange | null): [string | null, string | null] | null {
    return range ? [day(range.start), day(range.end)] : null;
}

describe("DateRangePickerComponent", () => {
    afterEach(() => {
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    describe("structure", () => {
        it("is a group named by its label, with a combobox for each end", async () => {
            const fixture = await create(ValueHostComponent);
            const host = getHost(fixture);
            const [start, end] = getInputs(fixture);

            expect(host.getAttribute("role")).toBe("group");
            expect(host.getAttribute("aria-label")).toBe("Trip");
            expect(host.hasAttribute("aria-describedby")).toBe(false);
            for (const [input, name] of [
                [start, "Start date"],
                [end, "End date"]
            ] as const) {
                expect(input.getAttribute("aria-label")).toBe(name);
                expect(input.getAttribute("role")).toBe("combobox");
                expect(input.getAttribute("aria-haspopup")).toBe("dialog");
                expect(input.getAttribute("aria-expanded")).toBe("false");
                expect(input.getAttribute("aria-describedby")).toBe("trip-hint");
            }
        });

        it("shows each end in the locale's format", async () => {
            const fixture = await create(FormHostComponent);

            expect(getInputs(fixture).map(input => input.value)).toEqual(["03/04/2025", "03/09/2025"]);
        });

        it("sizes each input by hidden text as wide as its longest date, and its placeholder", async () => {
            const fixture = await create(PresetHostComponent);
            // Digits are drawn at one width, so a numeric format needs one sample.
            expect(getSizerTexts(fixture)).toEqual([["00/00/0000"], ["00/00/0000"]]);
            const [start] = getInputs(fixture);
            expect(start.classList).toContain("tabular-nums");
            expect(["0", "0px"]).toContain(start.style.width);

            fixture.componentInstance.format.set("MMM d, yyyy");
            fixture.componentInstance.startPlaceholder.set("First night");
            await stable(fixture);
            const [startTexts, endTexts] = getSizerTexts(fixture);
            expect(endTexts).toHaveLength(12);
            expect(endTexts).toContain("Sep 00, 0000");
            expect(startTexts).toEqual([...endTexts, "First night"]);
        });
    });

    describe("typed text", () => {
        it("writes both ends once each input is left", async () => {
            const fixture = await create(ValueHostComponent);
            const [start, end] = getInputs(fixture);

            await typeAndBlur(fixture, start, "5/1/2025");
            expect(days(fixture.componentInstance.value())).toEqual(["2025-5-1", null]);
            expect(start.value).toBe("05/01/2025");

            await typeAndBlur(fixture, end, "5/7/2025");
            expect(days(fixture.componentInstance.value())).toEqual(["2025-5-1", "2025-5-7"]);
        });

        it("keeps the range and reports a parse error on the input whose text isn't a date", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;
            const [start, end] = getInputs(fixture);

            await typeAndBlur(fixture, end, "02/30/2025");

            expect(days(field().value())).toEqual(["2025-3-4", "2025-3-9"]);
            expect(end.value).toBe("02/30/2025");
            expect(end.getAttribute("aria-invalid")).toBe("true");
            expect(start.hasAttribute("aria-invalid")).toBe(false);
            expect(field().errors().map(error => error.kind)).toEqual(["parse"]);
            expect(getHost(fixture).getAttribute("data-invalid")).toBe("true");

            await typeAndBlur(fixture, end, "03/12/2025");
            expect(days(field().value())).toEqual(["2025-3-4", "2025-3-12"]);
            expect(field().errors()).toEqual([]);
            expect(end.hasAttribute("aria-invalid")).toBe(false);
        });

        it("reports an end before the start on the end, as a minDate error", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;
            const [start, end] = getInputs(fixture);

            await typeAndBlur(fixture, end, "03/01/2025");

            expect(days(field().value())).toEqual(["2025-3-4", "2025-3-9"]);
            expect(field().errors().map(error => error.kind)).toEqual(["minDate"]);
            expect(end.getAttribute("aria-invalid")).toBe("true");
            expect(start.hasAttribute("aria-invalid")).toBe(false);
        });

        it("reports a start after the end on the start, as a maxDate error", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;
            const [start] = getInputs(fixture);

            await typeAndBlur(fixture, start, "03/20/2025");

            expect(days(field().value())).toEqual(["2025-3-4", "2025-3-9"]);
            expect(field().errors().map(error => error.kind)).toEqual(["maxDate"]);
            expect(start.getAttribute("aria-invalid")).toBe("true");
        });

        it("checks both ends against min, max and the disabled dates", async () => {
            const fixture = await create(ValueHostComponent, host => {
                host.min.set(new Date(2025, 0, 1));
                host.max.set(new Date(2025, 11, 31));
                host.disabledDates.set(date => date.getDay() === 0);
            });
            const [start, end] = getInputs(fixture);

            await typeAndBlur(fixture, start, "12/30/2024");
            expect(fixture.componentInstance.value()).toBeNull();
            expect(start.getAttribute("aria-invalid")).toBe("true");

            await typeAndBlur(fixture, start, "03/04/2025");
            // March 9, 2025 is a Sunday.
            await typeAndBlur(fixture, end, "03/09/2025");
            expect(days(fixture.componentInstance.value())).toEqual(["2025-3-4", null]);
            expect(end.getAttribute("aria-invalid")).toBe("true");
        });

        it("commits on Enter, but not while an IME is composing", async () => {
            const fixture = await create(ValueHostComponent);
            const [, end] = getInputs(fixture);
            end.value = "05/07/2025";
            end.dispatchEvent(new Event("input", { bubbles: true }));

            end.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, isComposing: true, key: "Enter" }));
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBeNull();

            end.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
            await stable(fixture);
            expect(days(fixture.componentInstance.value())).toEqual([null, "2025-5-7"]);
        });

        it("empties an end with its clear button, and the value once both are empty", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;
            const clearButtons = () =>
                Array.from(getHost(fixture).querySelectorAll<HTMLButtonElement>("button[aria-label='Clear']"));

            clearButtons()[1].click();
            await stable(fixture);
            expect(days(field().value())).toEqual(["2025-3-4", null]);

            clearButtons()[0].click();
            await stable(fixture);
            expect(field().value()).toBeNull();
        });
    });

    describe("calendar", () => {
        it("opens a dialog with two months and writes the range once both ends are picked", async () => {
            const fixture = await create(FormHostComponent);
            const [start] = getInputs(fixture);

            getToggle(fixture).click();
            await stable(fixture);
            const dialog = getDialog() as HTMLElement;
            expect(dialog.getAttribute("aria-label")).toBe("Date range picker");
            expect(dialog.querySelectorAll("[role='grid']")).toHaveLength(2);
            expect(start.getAttribute("aria-expanded")).toBe("true");

            getDay("Tuesday, March 18, 2025").click();
            await stable(fixture);
            expect(days(fixture.componentInstance.form.stay().value())).toEqual(["2025-3-4", "2025-3-9"]);

            getDay("Wednesday, April 2, 2025").click();
            await stable(fixture);
            expect(days(fixture.componentInstance.form.stay().value())).toEqual(["2025-3-18", "2025-4-2"]);
            expect(getInputs(fixture).map(input => input.value)).toEqual(["03/18/2025", "04/02/2025"]);
        });

        it("ends a range that has only its start with the next day picked", async () => {
            const fixture = await create(ValueHostComponent, host => host.value.set({ end: null, start: new Date(2025, 4, 1) }));

            getToggle(fixture).click();
            await stable(fixture);
            getDay("Saturday, May 10, 2025").click();
            await stable(fixture);

            expect(days(fixture.componentInstance.value())).toEqual(["2025-5-1", "2025-5-10"]);
        });

        it("opens with Alt+ArrowDown and closes with Escape", async () => {
            const fixture = await create(ValueHostComponent);
            const [, end] = getInputs(fixture);

            end.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, bubbles: true, key: "ArrowDown" }));
            await stable(fixture);
            expect(getDialog()).not.toBeNull();

            end.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            await stable(fixture);
            await vi.waitFor(() => expect(getDialog()).toBeNull());
        });

        it("doesn't open when disabled or read-only", async () => {
            const fixture = await create(ValueHostComponent, host => host.readonly.set(true));

            getToggle(fixture).click();
            await stable(fixture);
            expect(getDialog()).toBeNull();
            expect(getToggle(fixture).disabled).toBe(true);

            fixture.componentInstance.readonly.set(false);
            fixture.componentInstance.disabled.set(true);
            await stable(fixture);
            expect(getInputs(fixture).every(input => input.disabled)).toBe(true);
            expect(getHost(fixture).getAttribute("aria-disabled")).toBe("true");
        });

        it("keeps the popup on a narrow screen, where its months wrap", async () => {
            const fixture = await create(ValueHostComponent);
            const createSpy = vi.spyOn(TestBed.inject(PopupService), "create");

            getToggle(fixture).click();
            await stable(fixture);

            // Two months are wider than a phone: the popup is pushed onto the screen when no side has room…
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ withPush: true }));
            // …and is no wider than it, so the calendar's months wrap onto new rows.
            expect(getDialog()?.classList).toContain("max-w-[calc(100dvw-1rem)]");
            createSpy.mockRestore();
        });
    });

    describe("presets", () => {
        beforeEach(() => {
            vi.useFakeTimers({ toFake: ["Date"] });
            // Wednesday, March 12, 2025.
            vi.setSystemTime(new Date(2025, 2, 12, 10));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("shows the quick ranges named by the locale, and writes the one picked", async () => {
            const fixture = await create(PresetHostComponent);

            getToggle(fixture).click();
            await stable(fixture);
            expect(getDialog()?.querySelector("[aria-label='Quick ranges']")?.getAttribute("role")).toBe("group");
            expect(getPresets().map(button => button.textContent?.trim())).toEqual([
                "Today",
                "Last 7 days",
                "This week",
                "Last month"
            ]);

            getPresets()[1].click();
            await stable(fixture);
            expect(days(fixture.componentInstance.value())).toEqual(["2025-3-6", "2025-3-12"]);
            expect(getInputs(fixture).map(input => input.value)).toEqual(["03/06/2025", "03/12/2025"]);
            await vi.waitFor(() => expect(getDialog()).toBeNull());
        });

        it("starts a week on firstDay", async () => {
            const fixture = await create(PresetHostComponent, host => host.firstDay.set("sunday"));

            getToggle(fixture).click();
            await stable(fixture);
            getPresets()[2].click();
            await stable(fixture);

            expect(days(fixture.componentInstance.value())).toEqual(["2025-3-9", "2025-3-15"]);
        });

        it("marks the quick range that is the value as pressed", async () => {
            const fixture = await create(PresetHostComponent, host =>
                host.value.set({ end: new Date(2025, 1, 28), start: new Date(2025, 1, 1) })
            );

            getToggle(fixture).click();
            await stable(fixture);

            expect(getPresets().map(button => button.getAttribute("aria-pressed"))).toEqual(["false", "false", "false", "true"]);
        });

        it("keeps a range within minDate and maxDate, and disables one with no day in them", async () => {
            const fixture = await create(PresetHostComponent, host => {
                host.presets.set(["thisMonth", "lastMonth"]);
                host.min.set(new Date(2025, 2, 1));
                host.max.set(new Date(2025, 2, 12));
            });

            getToggle(fixture).click();
            await stable(fixture);
            const [thisMonth, lastMonth] = getPresets();
            expect(lastMonth.disabled).toBe(true);

            thisMonth.click();
            await stable(fixture);
            expect(days(fixture.componentInstance.value())).toEqual(["2025-3-1", "2025-3-12"]);
        });

        it("takes quick ranges of its own", async () => {
            const fixture = await create(PresetHostComponent, host =>
                host.presets.set([
                    {
                        label: "Next 14 days",
                        range: today => ({
                            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13),
                            start: today
                        })
                    }
                ])
            );

            getToggle(fixture).click();
            await stable(fixture);
            expect(getPresets().map(button => button.textContent?.trim())).toEqual(["Next 14 days"]);
            getPresets()[0].click();
            await stable(fixture);

            expect(days(fixture.componentInstance.value())).toEqual(["2025-3-12", "2025-3-25"]);
        });

        it("closes with Escape from a quick range", async () => {
            const fixture = await create(PresetHostComponent);

            getToggle(fixture).click();
            await stable(fixture);
            getPresets()[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            await stable(fixture);

            await vi.waitFor(() => expect(getDialog()).toBeNull());
            expect(fixture.componentInstance.value()).toBeNull();
        });

        it("shows no quick ranges without presets", async () => {
            const fixture = await create(ValueHostComponent);

            getToggle(fixture).click();
            await stable(fixture);

            expect(getDialog()?.querySelector("[aria-label='Quick ranges']")).toBeNull();
        });
    });

    describe("forms", () => {
        it("marks the field touched only when focus leaves the picker and its popup", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;
            const [start, end] = getInputs(fixture);

            start.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: end }));
            await stable(fixture);
            expect(field().touched()).toBe(false);

            getToggle(fixture).click();
            await stable(fixture);
            end.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: getDialog() }));
            await stable(fixture);
            expect(field().touched()).toBe(false);

            end.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            await stable(fixture);
            expect(field().touched()).toBe(true);
        });

        it("shows a required range that is empty as invalid once touched", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.stay;

            field().value.set(null);
            field().markAsTouched();
            await stable(fixture);

            expect(field().invalid()).toBe(true);
            expect(getHost(fixture).getAttribute("data-invalid")).toBe("true");
            expect(getInputs(fixture).every(input => input.getAttribute("aria-invalid") === "true")).toBe(true);
        });
    });

    describe("accessibility", () => {
        it("has no axe violations, closed or open", async () => {
            const fixture = await create(FormHostComponent);
            const options = { rules: { region: { enabled: false } } };

            let results = await axe.run(fixture.nativeElement as HTMLElement, options);
            expect(results.violations.map(violation => violation.id)).toEqual([]);

            getToggle(fixture).click();
            await stable(fixture);
            results = await axe.run(getDialog() as HTMLElement, {
                rules: { ...options.rules, "color-contrast": { enabled: false } }
            });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("has no axe violations with quick ranges open", async () => {
            const fixture = await create(PresetHostComponent, host =>
                host.value.set({ end: new Date(2025, 1, 28), start: new Date(2025, 1, 1) })
            );

            getToggle(fixture).click();
            await stable(fixture);
            const results = await axe.run(getDialog() as HTMLElement, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("is named as a group by a wrapping label, whose click goes to the start input", async () => {
            const fixture = await create(WrappedHostComponent);
            const host = getHost(fixture);
            const [start, end] = getInputs(fixture);
            const caption = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>("[id]")).find(
                element => element.textContent?.trim() === "Holiday" && !element.contains(host)
            ) as HTMLElement;

            expect(host.getAttribute("aria-labelledby")).toBe(caption.id);
            expect(start.hasAttribute("aria-labelledby")).toBe(false);
            expect(end.hasAttribute("aria-labelledby")).toBe(false);

            // The browser's own label activation focuses the label's first input, which jsdom doesn't do.
            expect((caption.closest("label") as HTMLLabelElement).control).toBe(start);
        });

        it("focuses the start input, and takes focus on the host to pass it there", async () => {
            const fixture = await create(ValueHostComponent);
            const [start] = getInputs(fixture);
            const picker = fixture.debugElement.query(debug => debug.componentInstance instanceof DateRangePickerComponent)
                .componentInstance as DateRangePickerComponent;

            picker.focus();
            expect(document.activeElement).toBe(start);

            (document.getElementById("outside") as HTMLElement | null)?.focus();
            getHost(fixture).focus();
            expect(document.activeElement).toBe(start);
        });
    });
});
