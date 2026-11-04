import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import type { HourFormat } from "@nanahoshi/mona-ui/date-input";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { TimePickerComponent } from "./time-picker.component";

@Component({
    template: `<mona-time-picker
        aria-label="Opening time"
        [hourFormat]="hourFormat()"
        [max]="max()"
        [min]="min()"
        [(value)]="value"></mona-time-picker>`,
    imports: [TimePickerComponent]
})
class PickerHostComponent {
    public readonly hourFormat = signal<HourFormat | null>(null);
    public readonly max = signal<Date | undefined>(undefined);
    public readonly min = signal<Date | undefined>(undefined);
    public readonly value = signal<Date | null>(new Date(2025, 2, 4, 10, 0));
}

@Component({
    template: `
        <label for="close-time">Closing time</label>
        <mona-time-picker inputId="close-time" showSeconds readonlyInput [formField]="form.time"></mona-time-picker>
    `,
    imports: [TimePickerComponent, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ time: Date | null }>({ time: new Date(2025, 2, 4, 18, 30, 15) });
    public readonly form = form(this.#model);
}

async function create<T>(type: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-time-picker input") as HTMLInputElement;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function typeAndCommit(fixture: ComponentFixture<unknown>, text: string, how: "blur" | "enter"): Promise<void> {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (how === "blur") {
        input.dispatchEvent(new FocusEvent("blur"));
    } else {
        input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    }
    await stable(fixture);
}

function time(date: Date | null): string | null {
    return date
        ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
        : null;
}

describe("TimePickerComponent interaction", () => {
    afterEach(() => {
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
    });

    describe("typed text", () => {
        it("accepts a one-digit hour and keeps the value's day", async () => {
            const fixture = await create(PickerHostComponent, host => host.hourFormat.set("24"));

            await typeAndCommit(fixture, "9:05", "blur");

            expect(time(fixture.componentInstance.value())).toBe("2025-3-4 9:05");
            expect(getInput(fixture).value).toBe("09:05");
        });

        it("keeps the value instead of substituting min when the text isn't a time", async () => {
            const fixture = await create(PickerHostComponent, host => {
                host.hourFormat.set("24");
                host.min.set(new Date(2025, 0, 1, 8, 0));
            });

            await typeAndCommit(fixture, "25:00", "blur");

            expect(time(fixture.componentInstance.value())).toBe("2025-3-4 10:00");
            expect(getInput(fixture).value).toBe("25:00");
            expect(getInput(fixture).getAttribute("aria-invalid")).toBe("true");
        });

        it("marks a time after max invalid instead of setting it", async () => {
            const fixture = await create(PickerHostComponent, host => {
                host.hourFormat.set("24");
                host.max.set(new Date(2020, 5, 1, 17, 0));
            });

            await typeAndCommit(fixture, "23:00", "enter");
            expect(time(fixture.componentInstance.value())).toBe("2025-3-4 10:00");
            expect(getInput(fixture).getAttribute("aria-invalid")).toBe("true");

            // Only the time of day is compared with max, whatever its day.
            await typeAndCommit(fixture, "16:45", "enter");
            expect(time(fixture.componentInstance.value())).toBe("2025-3-4 16:45");
        });
    });

    describe("hour format", () => {
        it("follows the locale's clock unless hourFormat is set", async () => {
            const fixture = await create(PickerHostComponent);
            expect(getInput(fixture).value).toBe("10:00 AM");

            await typeAndCommit(fixture, "2:30 pm", "enter");
            expect(time(fixture.componentInstance.value())).toBe("2025-3-4 14:30");

            TestBed.inject(MonaI18nService).use({ ...MONA_DEFAULT_LOCALE, id: "de-DE" });
            await stable(fixture);
            expect(getInput(fixture).value).toBe("14:30");

            fixture.componentInstance.hourFormat.set("12");
            await stable(fixture);
            expect(getInput(fixture).value).not.toBe("14:30");
            TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        });
    });

    describe("forms and accessibility", () => {
        it("reports a parse error to the form field", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.time;
            const input = getInput(fixture);

            // readonlyInput blocks typing in the browser; the event still reaches the picker here.
            input.value = "abc";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new FocusEvent("blur"));
            await stable(fixture);

            expect(field().errors().map(error => error.kind)).toEqual(["parse"]);
            expect(field().value()?.getMinutes()).toBe(30);
        });

        it("labels the input, keeps aria-expanded, accepts bare attributes and passes axe", async () => {
            const fixture = await create(FormHostComponent);
            const input = getInput(fixture);

            expect(input.id).toBe("close-time");
            expect(input.readOnly).toBe(true);
            expect(input.getAttribute("aria-expanded")).toBe("false");
            expect(input.value).toBe("06:30:15 PM");

            const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });
});
