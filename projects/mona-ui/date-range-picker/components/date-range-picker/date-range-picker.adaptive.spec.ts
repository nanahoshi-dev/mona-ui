import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DateRange } from "../../models/DateRange";
import { DateRangePickerComponent } from "./date-range-picker.component";

@Component({
    template: `<mona-date-range-picker
        adaptiveMode="auto"
        aria-label="Stay"
        [presets]="['today', 'last7Days']"
        [(value)]="value"></mona-date-range-picker>`,
    imports: [DateRangePickerComponent]
})
class AdaptiveHostComponent {
    public readonly value = signal<DateRange | null>({ end: new Date(2025, 2, 9), start: new Date(2025, 2, 4) });
}

describe("DateRangePickerComponent with adaptiveMode", () => {
    let fixture: ComponentFixture<AdaptiveHostComponent>;

    afterEach(() => {
        vi.unstubAllGlobals();
        fixture.destroy();
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    async function create(smallScreen: boolean): Promise<void> {
        vi.stubGlobal(
            "matchMedia",
            vi.fn((query: string) => ({
                addEventListener: vi.fn(),
                matches: smallScreen,
                media: query,
                removeEventListener: vi.fn()
            }))
        );
        TestBed.configureTestingModule({ imports: [AdaptiveHostComponent] });
        fixture = TestBed.createComponent(AdaptiveHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        await stable();
    }

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function openCalendar(): Promise<HTMLElement> {
        const host = fixture.nativeElement as HTMLElement;
        (host.querySelector("button[aria-label='Open calendar']") as HTMLButtonElement).click();
        await stable();
        // The calendar takes focus once the popup has opened, a task later.
        await new Promise(resolve => setTimeout(resolve));
        await stable();
        return document.querySelector(".cdk-overlay-container [role='dialog']") as HTMLElement;
    }

    function getPresets(dialog: HTMLElement): HTMLButtonElement[] {
        return Array.from(dialog.querySelectorAll<HTMLButtonElement>("[aria-label='Quick ranges'] button"));
    }

    function getDay(dialog: HTMLElement, label: string): HTMLElement {
        return dialog.querySelector(`[monaMonthDay][aria-label='${label}']`) as HTMLElement;
    }

    it("opens the calendar and quick ranges as a bottom sheet on a small screen, with taller quick ranges", async () => {
        await create(true);
        const dialog = await openCalendar();

        const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Stay");
        expect(dialog.getAttribute("aria-label")).toBe("Date range picker");
        // The sheet is as wide as the screen, so the popup's own limit goes, and it scrolls when it's taller.
        expect(dialog.classList).toContain("max-w-none");
        expect(dialog.classList).toContain("min-h-0");
        expect(getPresets(dialog).map(preset => preset.classList.contains("h-11"))).toEqual([true, true]);
        expect(dialog.contains(document.activeElement)).toBe(true);
        const results = await axe.run(sheet, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("sets a range from two tapped days and closes the sheet", async () => {
        await create(true);
        const dialog = await openCalendar();

        getDay(dialog, "Tuesday, March 18, 2025").click();
        await stable();
        getDay(dialog, "Friday, March 21, 2025").click();
        await stable();
        await new Promise(resolve => setTimeout(resolve, 300));
        await stable();

        const value = fixture.componentInstance.value();
        expect([value?.start?.getDate(), value?.end?.getDate()]).toEqual([18, 21]);
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
    });

    it("opens under the field on a wide screen, with quick ranges as tall as a calendar row", async () => {
        await create(false);
        const dialog = await openCalendar();
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        expect(getPresets(dialog).map(preset => preset.classList.contains("h-11"))).toEqual([false, false]);
    });
});
