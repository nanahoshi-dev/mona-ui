import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { AdaptiveMode } from "@nanahoshi/mona-ui/dropdowns";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoCompleteComponent } from "./auto-complete.component";

@Component({
    template: `
        <mona-auto-complete
            aria-label="Country"
            adaptiveTitle="Choose a country"
            [adaptiveMode]="adaptiveMode()"
            [monaDropDownFilterable]="{ debounce: 50 }"
            [data]="countries"
            [(value)]="country"></mona-auto-complete>
    `,
    imports: [AutoCompleteComponent, DropdownFilterableDirective]
})
class AdaptiveAutoCompleteHostComponent {
    protected readonly countries = ["Austria", "Belgium", "Canada", "Denmark"];
    public readonly adaptiveMode = signal<AdaptiveMode>("auto");
    public readonly country = signal<string | null>(null);
}

describe("AutoCompleteComponent with adaptiveMode", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => {
        clearOverlays();
        vi.unstubAllGlobals();
    });

    it("opens a bottom sheet with a text box of its own, and the whole list, when the field is pressed", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        expect(getField(fixture).getAttribute("inputmode")).toBe("none");

        await pressField(fixture);

        const textBox = getSheetTextBox();
        expect(document.activeElement).toBe(textBox);
        expect(textBox.value).toBe("");
        const title = document.getElementById(textBox.getAttribute("aria-labelledby") ?? "");
        expect(title?.textContent?.trim()).toBe("Choose a country");
        expect(getOptions()).toHaveLength(4);
        expect(getSheet().querySelector("section")?.classList).toContain("h-dvh");
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("suggests as the sheet's text box is typed in, and stays open when the text is deleted", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);

        await typeInSheet(fixture, "ia");
        expect(getOptions().map(option => option.textContent?.trim())).toEqual(["Austria"]);
        expect(getSheetTextBox().getAttribute("aria-activedescendant")).toBe(getOptions()[0].id);

        await typeInSheet(fixture, "");
        expect(getSheet(false)).not.toBeNull();
        expect(getOptions()).toHaveLength(4);
        expect(fixture.componentInstance.country()).toBeNull();
    });

    it("opens with the field's text, filtering the list by it", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        fixture.componentInstance.country.set("Bel");
        await settle(fixture);

        await pressField(fixture);

        expect(getSheetTextBox().value).toBe("Bel");
        expect(getOptions().map(option => option.textContent?.trim())).toEqual(["Belgium"]);
    });

    it("takes the highlighted suggestion with Enter, closes the sheet and gives focus back to the field", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);
        await typeInSheet(fixture, "den");

        pressSheetKey("Enter");
        await settle(fixture);

        expect(fixture.componentInstance.country()).toBe("Denmark");
        expect(getSheet(false)).toBeNull();
        expect(document.activeElement).toBe(getField(fixture));
        expect(getField(fixture).value).toBe("Denmark");
    });

    it("keeps the suggestion Enter took when it's pressed before the filter catches up with the typing", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);
        await typeInSheet(fixture, "ca");
        const textBox = getSheetTextBox();
        textBox.value = "can";
        textBox.dispatchEvent(new Event("input", { bubbles: true }));

        pressSheetKey("Enter");
        await settle(fixture);

        expect(fixture.componentInstance.country()).toBe("Canada");
        expect(getField(fixture).value).toBe("Canada");
    });

    it("takes a tapped suggestion", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);

        getOption("Austria").click();
        await settle(fixture);

        expect(fixture.componentInstance.country()).toBe("Austria");
        expect(getSheet(false)).toBeNull();
        expect(document.activeElement).toBe(getField(fixture));
    });

    it("closes with Escape, keeping the typed text in the field, which takes it as its value when left", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);
        await typeInSheet(fixture, "Narnia");

        pressSheetKey("Escape");
        await settle(fixture);

        expect(getSheet(false)).toBeNull();
        const field = getField(fixture);
        expect(document.activeElement).toBe(field);
        expect(field.value).toBe("Narnia");

        field.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
        await waitForStable(fixture);
        expect(fixture.componentInstance.country()).toBe("Narnia");
    });

    it("leaves the field to take typing on a wide screen", async () => {
        stubSmallScreen(false);
        const fixture = await createFixture();
        expect(getField(fixture).getAttribute("inputmode")).toBeNull();

        await pressField(fixture);
        expect(document.querySelector(".cdk-overlay-container [role='listbox']")).toBeNull();

        const field = getField(fixture);
        field.value = "Can";
        field.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        expect(getOptions().map(option => option.textContent?.trim())).toEqual(["Canada"]);
        expect(document.activeElement).toBe(field);
    });
});

async function createFixture(): Promise<ComponentFixture<AdaptiveAutoCompleteHostComponent>> {
    await TestBed.configureTestingModule({ imports: [AdaptiveAutoCompleteHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AdaptiveAutoCompleteHostComponent);
    document.body.append(fixture.nativeElement as HTMLElement);
    await waitForStable(fixture);
    return fixture;
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

/** Waits for the sheet's slide and the filter to finish. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    await waitForStable(fixture);
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitForStable(fixture);
}

async function pressField(fixture: ComponentFixture<unknown>): Promise<void> {
    const field = getField(fixture);
    field.focus();
    field.click();
    await waitForStable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

async function typeInSheet(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const textBox = getSheetTextBox();
    textBox.value = text;
    textBox.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(fixture);
}

function pressSheetKey(key: string): void {
    getSheetTextBox().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function getField(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-auto-complete input") as HTMLInputElement;
}

function getSheet(required = true): HTMLElement {
    const sheet = document.querySelector("mona-dropdown-sheet") as HTMLElement | null;
    if (required && !sheet) {
        throw new Error("The sheet isn't open");
    }
    return sheet as HTMLElement;
}

function getSheetTextBox(): HTMLInputElement {
    return getSheet().querySelector("input[data-mona-sheet-autofocus]") as HTMLInputElement;
}

function getOptions(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll("li[role='option']"));
}

function getOption(text: string): HTMLElement {
    const option = getOptions().find(item => item.textContent?.includes(text));
    if (!option) {
        throw new Error(`Option not found: ${text}`);
    }
    return option;
}

function clearOverlays(): void {
    document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());
}

function stubSmallScreen(matches: boolean): void {
    vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
            addEventListener: vi.fn(),
            matches,
            media: query,
            removeEventListener: vi.fn()
        }))
    );
}
