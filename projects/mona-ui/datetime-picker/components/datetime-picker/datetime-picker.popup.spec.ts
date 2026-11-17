import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { CalendarMonthCellTemplateDirective } from "@nanahoshi/mona-ui/calendar";
import { DateInputPrefixTemplateDirective } from "@nanahoshi/mona-ui/date-input";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTimePickerComponent } from "./datetime-picker.component";

@Component({
    template: `
        <mona-datetime-picker
            aria-label="Meeting start"
            hourFormat="24"
            [disabled]="disabled()"
            [max]="max()"
            [min]="min()"
            [readonly]="readonly()"
            [(value)]="value"
            (touch)="touches = touches + 1"></mona-datetime-picker>
        <button id="outside" type="button">Outside</button>
    `,
    imports: [DateTimePickerComponent]
})
class PickerHostComponent {
    public readonly disabled = signal(false);
    public readonly max = signal<Date | undefined>(undefined);
    public readonly min = signal<Date | undefined>(undefined);
    public readonly readonly = signal(false);
    public readonly value = signal<Date | null>(new Date(2026, 2, 4, 10, 15));
    public touches = 0;
}

@Component({
    template: `
        <mona-datetime-picker aria-label="Meeting start" [value]="value">
            <ng-template monaDateInputPrefixTemplate><span class="prefix-mark">At</span></ng-template>
            <ng-template monaCalendarMonthCellTemplate let-day>
                <b class="day-mark">{{ day }}</b>
            </ng-template>
        </mona-datetime-picker>
    `,
    imports: [DateTimePickerComponent, DateInputPrefixTemplateDirective, CalendarMonthCellTemplateDirective]
})
class TemplateHostComponent {
    public readonly value = new Date(2026, 2, 4, 10, 15);
}

describe("DateTimePickerComponent popup", () => {
    let fixture: ComponentFixture<PickerHostComponent>;
    let host: PickerHostComponent;

    async function stable(): Promise<void> {
        await vi.runAllTimersAsync();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function create(setup?: (picker: PickerHostComponent) => void): Promise<void> {
        TestBed.configureTestingModule({ imports: [PickerHostComponent] });
        fixture = TestBed.createComponent(PickerHostComponent);
        host = fixture.componentInstance;
        setup?.(host);
        document.body.appendChild(fixture.nativeElement as HTMLElement);
        await stable();
    }

    function pickerHost(): HTMLElement {
        return (fixture.nativeElement as HTMLElement).querySelector("mona-datetime-picker") as HTMLElement;
    }

    function input(): HTMLInputElement {
        return pickerHost().querySelector("input") as HTMLInputElement;
    }

    function popup(): HTMLElement | null {
        return document.querySelector("div[role='dialog']");
    }

    function expanded(): string | null {
        return input().getAttribute("aria-expanded");
    }

    async function openPopup(): Promise<HTMLElement> {
        (pickerHost().querySelector("button[monaButton]") as HTMLButtonElement).click();
        await stable();
        const element = popup();
        if (element == null) {
            throw new Error("The popup did not open");
        }
        return element;
    }

    function popupButton(text: string): HTMLButtonElement {
        const match = Array.from(popup()?.querySelectorAll("button") ?? []).find(b => b.textContent?.trim() === text);
        if (match == null) {
            throw new Error(`No popup button ${text}`);
        }
        return match;
    }

    async function clickDay(day: number): Promise<void> {
        const cells = Array.from(popup()?.querySelectorAll<HTMLElement>("[role='gridcell'][aria-label]") ?? []);
        const cell = cells.find(c => c.textContent?.trim() === String(day));
        if (cell == null) {
            throw new Error(`No day ${day}`);
        }
        cell.click();
        await stable();
    }

    async function clickTime(list: "Hours" | "Minutes", value: number): Promise<void> {
        const option = popup()?.querySelector<HTMLElement>(`ol[aria-label="${list}"] li[data-value="${value}"]`);
        if (option == null) {
            throw new Error(`No ${list} option ${value}`);
        }
        option.click();
        await stable();
    }

    async function press(target: Element, key: string, init: KeyboardEventInit = {}): Promise<void> {
        target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init }));
        await stable();
    }

    function shownView(): "date" | "time" | null {
        if (popup()?.querySelector("mona-calendar")) {
            return "date";
        }
        return popup()?.querySelector("mona-time-selector") ? "time" : null;
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 1, 9, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    describe("choosing a date and time", () => {
        it("keeps the time already chosen when a day is picked, then shows the time", async () => {
            await create();
            await openPopup();

            await clickDay(12);
            expect(shownView()).toBe("time");
            expect(host.value()).toEqual(new Date(2026, 2, 4, 10, 15));

            popupButton("Set").click();
            await stable();
            expect(host.value()).toEqual(new Date(2026, 2, 12, 10, 15));
            expect(expanded()).toBe("false");
        });

        it("changes only the time when an hour and a minute are picked", async () => {
            await create();
            await openPopup();
            popupButton("Time").click();
            await stable();

            await clickTime("Hours", 14);
            await clickTime("Minutes", 45);
            popupButton("Set").click();
            await stable();

            expect(host.value()).toEqual(new Date(2026, 2, 4, 14, 45));
        });

        it("discards what was picked on Cancel, and opens at the value again", async () => {
            await create();
            await openPopup();
            await clickDay(12);

            popupButton("Cancel").click();
            await stable();
            expect(host.value()).toEqual(new Date(2026, 2, 4, 10, 15));
            expect(expanded()).toBe("false");

            await openPopup();
            expect(shownView()).toBe("date");
            const selected = popup()?.querySelector("[role='gridcell'][aria-selected='true']");
            expect(selected?.textContent?.trim()).toBe("4");
        });

        it("closes and opens from its button", async () => {
            await create();
            await openPopup();

            (pickerHost().querySelector("button[monaButton]") as HTMLButtonElement).click();
            await stable();
            expect(expanded()).toBe("false");
        });
    });

    describe("min and max", () => {
        it("moves a picked day up to min when its time is earlier", async () => {
            const min = new Date(2026, 2, 12, 11, 0);
            await create(picker => picker.min.set(min));
            await openPopup();

            await clickDay(12);
            popupButton("Set").click();
            await stable();

            expect(host.value()).toEqual(min);
        });

        it("moves a picked day down to max when its time is later", async () => {
            const max = new Date(2026, 2, 12, 9, 0);
            await create(picker => picker.max.set(max));
            await openPopup();

            await clickDay(12);
            popupButton("Set").click();
            await stable();

            expect(host.value()).toEqual(max);
        });

        it("moves a picked time into the range on min's day", async () => {
            const min = new Date(2026, 2, 4, 10, 0);
            const max = new Date(2026, 2, 4, 18, 0);
            await create(picker => {
                picker.min.set(min);
                picker.max.set(max);
            });
            await openPopup();
            popupButton("Time").click();
            await stable();

            await clickTime("Minutes", 0);
            popupButton("Set").click();
            await stable();
            expect(host.value()).toEqual(new Date(2026, 2, 4, 10, 0));
        });

        it("starts from now moved into the range when there is no value", async () => {
            const min = new Date(2026, 2, 20, 8, 0);
            await create(picker => {
                picker.value.set(null);
                picker.min.set(min);
            });
            await openPopup();

            popupButton("Set").click();
            await stable();
            expect(host.value()).toEqual(min);
        });

        it("starts from now when there is no value and now is in the range", async () => {
            await create(picker => picker.value.set(null));
            await openPopup();

            popupButton("Set").click();
            await stable();
            expect(host.value()).toEqual(new Date(2026, 2, 1, 9, 0));
        });
    });

    describe("keyboard", () => {
        it("opens on Alt+ArrowDown and switches views with Alt+ArrowRight and Alt+ArrowLeft", async () => {
            await create();

            await press(input(), "ArrowDown", { altKey: true });
            expect(expanded()).toBe("true");
            expect(shownView()).toBe("date");

            await press(input(), "ArrowRight", { altKey: true });
            expect(shownView()).toBe("time");
            await press(input(), "ArrowLeft", { altKey: true });
            expect(shownView()).toBe("date");
        });

        it("cancels on Escape in the input", async () => {
            await create();
            await openPopup();
            await clickDay(12);

            await press(input(), "Escape");
            expect(expanded()).toBe("false");
            expect(host.value()).toEqual(new Date(2026, 2, 4, 10, 15));
        });

        it("leaves Escape, Alt+ArrowUp and Alt+ArrowRight alone while closed", async () => {
            await create();

            await press(input(), "Escape");
            await press(input(), "ArrowUp", { altKey: true });
            await press(input(), "ArrowRight", { altKey: true });
            expect(expanded()).toBe("false");
            expect(popup()).toBeNull();
        });

        it("switches views and cancels from inside the calendar", async () => {
            await create();
            await openPopup();
            const grid = popup()?.querySelector("mona-calendar [role='grid']") as HTMLElement;

            await press(grid, "ArrowRight", { altKey: true });
            expect(shownView()).toBe("time");
            const hours = popup()?.querySelector("ol[aria-label='Hours']") as HTMLElement;
            await press(hours, "ArrowLeft", { altKey: true });
            expect(shownView()).toBe("date");

            await clickDay(12);
            const minutes = popup()?.querySelector("ol[aria-label='Minutes']") as HTMLElement;
            await press(minutes, "Escape");
            expect(expanded()).toBe("false");
            expect(host.value()).toEqual(new Date(2026, 2, 4, 10, 15));
        });

        it("sets the value on Enter in the time view, and closes on Alt+ArrowUp inside it", async () => {
            await create();
            await openPopup();
            await clickDay(12);

            await press(popup()?.querySelector("ol[aria-label='Hours']") as HTMLElement, "Enter");
            expect(host.value()).toEqual(new Date(2026, 2, 12, 10, 15));
            expect(expanded()).toBe("false");

            await openPopup();
            await clickDay(20);
            await press(popup()?.querySelector("ol[aria-label='Hours']") as HTMLElement, "ArrowUp", { altKey: true });
            expect(expanded()).toBe("false");
            expect(host.value()).toEqual(new Date(2026, 2, 12, 10, 15));
        });

        it("moves between the tabs with Home and End", async () => {
            await create();
            await openPopup();
            const tablist = popup()?.querySelector("[role='tablist']") as HTMLElement;
            const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>("[role='tab']"));

            await press(tabs[0], "End");
            expect(shownView()).toBe("time");
            expect(document.activeElement).toBe(tabs[1]);

            await press(tabs[1], "Home");
            expect(shownView()).toBe("date");
            expect(document.activeElement).toBe(tabs[0]);

            await press(tabs[0], "ArrowDown");
            await press(tabs[0], "End", { altKey: true });
            expect(shownView()).toBe("date");
        });
    });

    describe("focus and state", () => {
        it("reports a touch when focus leaves for the page, not for its popup", async () => {
            await create();
            const popupElement = await openPopup();
            const outside = document.getElementById("outside") as HTMLButtonElement;

            input().dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: popupElement }));
            expect(host.touches).toBe(0);

            input().dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }));
            expect(host.touches).toBe(1);
        });

        it("does not open while disabled or read-only", async () => {
            await create(picker => picker.readonly.set(true));
            (pickerHost().querySelector("button[monaButton]") as HTMLButtonElement).click();
            await press(input(), "ArrowDown", { altKey: true });
            expect(popup()).toBeNull();

            host.readonly.set(false);
            host.disabled.set(true);
            await stable();
            await press(pickerHost(), "ArrowDown", { altKey: true });
            expect(popup()).toBeNull();
        });
    });

    it("shows the prefix and month cell templates it is given", async () => {
        TestBed.configureTestingModule({ imports: [TemplateHostComponent] });
        const templateFixture = TestBed.createComponent(TemplateHostComponent);
        document.body.appendChild(templateFixture.nativeElement as HTMLElement);
        templateFixture.detectChanges();
        await vi.runAllTimersAsync();
        templateFixture.detectChanges();
        const element = templateFixture.nativeElement as HTMLElement;
        expect(element.querySelector(".prefix-mark")?.textContent).toBe("At");

        (element.querySelector("mona-datetime-picker button[monaButton]") as HTMLButtonElement).click();
        templateFixture.detectChanges();
        await vi.runAllTimersAsync();
        templateFixture.detectChanges();
        const marks = Array.from(popup()?.querySelectorAll(".day-mark") ?? []).map(mark => mark.textContent?.trim());
        expect(marks).toContain("4");
    });
});
