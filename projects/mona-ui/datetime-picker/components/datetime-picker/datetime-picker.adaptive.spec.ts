import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTimePickerComponent } from "./datetime-picker.component";

@Component({
    template: `
        <span id="meeting-label">Meeting start</span>
        <mona-datetime-picker
            adaptiveMode="auto"
            aria-labelledby="meeting-label"
            hourFormat="24"
            [(value)]="value"></mona-datetime-picker>
    `,
    imports: [DateTimePickerComponent]
})
class AdaptiveHostComponent {
    public readonly value = signal<Date | null>(new Date(2026, 2, 4, 10, 15));
}

describe("DateTimePickerComponent with adaptiveMode", () => {
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
        (host.querySelector("button[aria-label='Open date and time picker']") as HTMLButtonElement).click();
        await stable();
        // The popup reports itself open after a task.
        await new Promise(resolve => setTimeout(resolve));
        await stable();
        return document.querySelector(".cdk-overlay-container [role='dialog']") as HTMLElement;
    }

    async function showTimeTab(dialog: HTMLElement): Promise<HTMLElement> {
        (dialog.querySelectorAll<HTMLButtonElement>("[role='tab']")[1] as HTMLButtonElement).click();
        await stable();
        return dialog.querySelector("mona-time-selector")?.parentElement as HTMLElement;
    }

    it("opens as a bottom sheet on a small screen, titled by the input's aria-labelledby text", async () => {
        await create(true);
        const dialog = await openPopup();

        const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Meeting start");
        expect(dialog.getAttribute("aria-label")).toBe("Date and time picker");
        // The sheet sets the height, in place of the fixed one under the field.
        expect(dialog.classList).toContain("rounded-none");
        expect(dialog.classList).not.toContain("h-68");
        expect(dialog.classList).toContain("flex-col");
        expect(dialog.contains(document.activeElement)).toBe(true);
        const results = await axe.run(sheet, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("lets the time selector fill the panel on the time tab, with larger rows", async () => {
        await create(true);
        const dialog = await openPopup();

        const timeView = await showTimeTab(dialog);
        expect(timeView.classList).not.toContain("max-h-64");
        expect(timeView.querySelector("ol[aria-label='Hours'] li")?.classList).toContain("h-8");
        const results = await axe.run(document.querySelector("mona-dropdown-sheet") as HTMLElement, {
            rules: { region: { enabled: false } }
        });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("keeps the fixed height and the field's size under the field on a wide screen", async () => {
        await create(false);
        const dialog = await openPopup();
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        expect(dialog.classList).toContain("h-68");
        expect((dialog.querySelector("[role='tabpanel']") as HTMLElement).style.height).toBe("");

        const timeView = await showTimeTab(dialog);
        expect(timeView.classList).toContain("max-h-64");
        expect(timeView.querySelector("ol[aria-label='Hours'] li")?.classList).toContain("h-7");
    });
});
