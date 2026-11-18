import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { AdaptiveMode } from "@nanahoshi/mona-ui/dropdowns";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePickerComponent } from "./date-picker.component";

@Component({
    template: `
        <label for="trip-date">Trip date</label>
        <mona-date-picker inputId="trip-date" [adaptiveMode]="adaptiveMode()" [(value)]="value"></mona-date-picker>
    `,
    imports: [DatePickerComponent]
})
class AdaptiveHostComponent {
    public readonly adaptiveMode = signal<AdaptiveMode>("auto");
    public readonly value = signal<Date | null>(new Date(2025, 2, 4));
}

describe("DatePickerComponent with adaptiveMode", () => {
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

    function getSheet(): HTMLElement | null {
        return document.querySelector("mona-dropdown-sheet");
    }

    it("opens the calendar as a bottom sheet on a small screen, titled by the input's label", async () => {
        await create(true);
        const dialog = await openCalendar();

        const sheet = getSheet() as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Trip date");
        expect(sheet.contains(dialog)).toBe(true);
        expect(dialog.getAttribute("aria-label")).toBe("Date picker");
        // The popup fills the sheet, which draws the corners, and the calendar's days grow there.
        expect(dialog.classList).toContain("rounded-none");
        expect(dialog.className).toContain("[--mona-calendar-cell-size:");
        // Focus moves into the calendar, as it does in the popup under the field.
        expect(dialog.contains(document.activeElement)).toBe(true);
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("sets a tapped day and closes the sheet", async () => {
        await create(true);
        const dialog = await openCalendar();

        const tenth = Array.from(dialog.querySelectorAll<HTMLElement>("[role='gridcell'][aria-label]")).find(
            cell => cell.textContent?.trim() === "10"
        );
        tenth?.click();
        await stable();
        await new Promise(resolve => setTimeout(resolve, 300));
        await stable();

        expect(fixture.componentInstance.value()?.getDate()).toBe(10);
        expect(getSheet()).toBeNull();
    });

    it("opens under the field on a wide screen", async () => {
        await create(false);
        const dialog = await openCalendar();
        expect(getSheet()).toBeNull();
        expect(dialog.classList).not.toContain("rounded-none");
        expect(dialog.className).not.toContain("[--mona-calendar-cell-size:");
    });

    it("opens under the field without adaptiveMode", async () => {
        await create(true);
        fixture.componentInstance.adaptiveMode.set("none");
        await stable();
        await openCalendar();
        expect(getSheet()).toBeNull();
    });
});
