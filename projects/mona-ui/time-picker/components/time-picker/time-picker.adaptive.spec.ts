import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePickerComponent } from "./time-picker.component";

@Component({
    template: `<mona-time-picker
        adaptiveMode="auto"
        adaptiveTitle="Remind me at"
        aria-label="Reminder"
        hourFormat="24"
        [(value)]="value"></mona-time-picker>`,
    imports: [TimePickerComponent]
})
class AdaptiveHostComponent {
    public readonly value = signal<Date | null>(new Date(2026, 2, 4, 9, 30));
}

describe("TimePickerComponent with adaptiveMode", () => {
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

    async function openPopup(): Promise<HTMLElement> {
        const host = fixture.nativeElement as HTMLElement;
        (host.querySelector("button[aria-label='Open time picker']") as HTMLButtonElement).click();
        await stable();
        return document.querySelector(".cdk-overlay-container [role='dialog']") as HTMLElement;
    }

    function firstHour(dialog: HTMLElement): HTMLElement {
        return dialog.querySelector("ol[aria-label='Hours'] li") as HTMLElement;
    }

    it("opens the time selector as a bottom sheet on a small screen, with larger rows and a set height", async () => {
        await create(true);
        const dialog = await openPopup();

        const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Remind me at");
        expect(dialog.getAttribute("aria-label")).toBe("Time picker");
        expect(dialog.classList).toContain("rounded-none");
        // The time selector sizes its lists from its own height, so the sheet sets one.
        expect(dialog.classList).toContain("[&_mona-time-selector]:h-72");
        expect(firstHour(dialog).classList).toContain("h-8");
        expect(dialog.contains(document.activeElement)).toBe(true);
        const results = await axe.run(sheet, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("opens under the field on a wide screen, with the field's size", async () => {
        await create(false);
        const dialog = await openPopup();
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        expect(dialog.classList).not.toContain("[&_mona-time-selector]:h-72");
        expect(firstHour(dialog).classList).toContain("h-7");
    });
});
