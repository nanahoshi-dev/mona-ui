import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTimePickerComponent } from "./datetime-picker.component";

@Component({
    template: `<mona-datetime-picker
        aria-label="Meeting start"
        [min]="min()"
        [(value)]="value"></mona-datetime-picker>`,
    imports: [DateTimePickerComponent]
})
class PickerHostComponent {
    public readonly min = signal<Date | undefined>(undefined);
    public readonly value = signal<Date | null>(new Date(2025, 2, 4, 10, 0));
}

async function create(setup?: (host: PickerHostComponent) => void): Promise<ComponentFixture<PickerHostComponent>> {
    TestBed.configureTestingModule({ imports: [PickerHostComponent] });
    const fixture = TestBed.createComponent(PickerHostComponent);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-datetime-picker") as HTMLElement;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return getHost(fixture).querySelector("input") as HTMLInputElement;
}

function getPopup(): HTMLElement | null {
    return document.querySelector("div[role='dialog']");
}

async function openPopup(fixture: ComponentFixture<unknown>): Promise<HTMLElement> {
    (getHost(fixture).querySelector("button[monaButton]") as HTMLButtonElement).click();
    await stable(fixture);
    return getPopup() as HTMLElement;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function typeAndBlur(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("blur"));
    await stable(fixture);
}

function stamp(date: Date | null): string | null {
    return date
        ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
        : null;
}

describe("DateTimePickerComponent interaction", () => {
    afterEach(() => {
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    describe("typed text", () => {
        it("accepts one-digit parts in the locale's format", async () => {
            const fixture = await create();
            expect(getInput(fixture).value).toBe("03/04/2025, 10:00 AM");

            await typeAndBlur(fixture, "1/5/2025, 9:05 PM");

            expect(stamp(fixture.componentInstance.value())).toBe("2025-1-5 21:05");
            expect(getInput(fixture).value).toBe("01/05/2025, 09:05 PM");
        });

        it("keeps the value when the text is before min, and marks the field invalid", async () => {
            const fixture = await create(host => host.min.set(new Date(2025, 2, 1, 9, 0)));

            await typeAndBlur(fixture, "03/01/2025, 08:30 AM");

            expect(stamp(fixture.componentInstance.value())).toBe("2025-3-4 10:00");
            expect(getInput(fixture).getAttribute("aria-invalid")).toBe("true");
        });
    });

    describe("accessibility", () => {
        it("gives the input the combobox role and passes axe while closed", async () => {
            const fixture = await create();
            const input = getInput(fixture);

            expect(input.getAttribute("role")).toBe("combobox");
            expect(input.getAttribute("aria-label")).toBe("Meeting start");
            expect(input.getAttribute("aria-expanded")).toBe("false");

            const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("builds the Date and Time switch as tabs with a tab panel", async () => {
            const fixture = await create();
            const popup = await openPopup(fixture);
            const tabs = Array.from(popup.querySelectorAll<HTMLButtonElement>("[role='tablist'] [role='tab']"));
            const panel = popup.querySelector("[role='tabpanel']") as HTMLElement;

            expect(tabs.map(tab => tab.getAttribute("aria-selected"))).toEqual(["true", "false"]);
            expect(tabs.some(tab => tab.hasAttribute("aria-pressed"))).toBe(false);
            expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1]);
            expect(tabs[0].getAttribute("aria-controls")).toBe(panel.id);
            expect(panel.getAttribute("aria-labelledby")).toBe(tabs[0].id);
            expect(popup.querySelectorAll("div[aria-label]:not([role])").length).toBe(0);

            tabs[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
            await stable(fixture);

            expect(tabs.map(tab => tab.getAttribute("aria-selected"))).toEqual(["false", "true"]);
            expect(document.activeElement).toBe(tabs[1]);
            expect(panel.getAttribute("aria-labelledby")).toBe(tabs[1].id);
            expect(panel.querySelector("mona-time-selector")).not.toBeNull();
        });

        it("closes on Alt+ArrowUp without logging a warning", async () => {
            vi.useFakeTimers();
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            try {
                const fixture = await create();
                await openPopup(fixture);

                getInput(fixture).dispatchEvent(
                    new KeyboardEvent("keydown", { altKey: true, bubbles: true, key: "ArrowUp" })
                );
                await vi.runAllTimersAsync();
                await stable(fixture);

                expect(getInput(fixture).getAttribute("aria-expanded")).toBe("false");
                expect(warn).not.toHaveBeenCalled();
            } finally {
                warn.mockRestore();
                vi.useRealTimers();
            }
        });
    });
});
