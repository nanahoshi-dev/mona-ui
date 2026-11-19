import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { AdaptiveMode } from "@nanahoshi/mona-ui/dropdowns";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComboBoxComponent } from "./combo-box.component";

@Component({
    template: `
        <label for="fruit">Fruit</label>
        <mona-combo-box
            inputId="fruit"
            monaDropDownFilterable
            [adaptiveMode]="adaptiveMode()"
            [allowCustomValue]="allowCustomValue()"
            [data]="fruits"
            [(value)]="fruit"
            (valueAdd)="added.push($event)"></mona-combo-box>
        <button type="button">After</button>
    `,
    imports: [ComboBoxComponent, DropdownFilterableDirective]
})
class AdaptiveComboBoxHostComponent {
    protected readonly fruits = ["Apple", "Banana", "Carrot", "Date"];
    public readonly adaptiveMode = signal<AdaptiveMode>("auto");
    public readonly added: string[] = [];
    public readonly allowCustomValue = signal(false);
    public fruit: string | null = "Banana";
}

describe("ComboBoxComponent with adaptiveMode", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => {
        clearOverlays();
        vi.unstubAllGlobals();
    });

    it("opens a bottom sheet with a text box of its own when the field is pressed on a small screen", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        const field = getField(fixture);
        // The field raises no on-screen keyboard: the sheet's text box takes the typing.
        expect(field.getAttribute("inputmode")).toBe("none");

        await pressField(fixture);

        const sheet = getSheet();
        const textBox = getSheetTextBox();
        expect(document.activeElement).toBe(textBox);
        expect(textBox.value).toBe("Banana");
        expect(textBox.getAttribute("role")).toBe("combobox");
        expect(textBox.getAttribute("aria-expanded")).toBe("true");
        expect(textBox.getAttribute("aria-controls")).toBe(sheet.querySelector("[role='listbox']")?.id);
        // The sheet's title, the field's label, names the text box.
        const title = document.getElementById(textBox.getAttribute("aria-labelledby") ?? "");
        expect(title?.textContent?.trim()).toBe("Fruit");
        expect(title?.closest("header")).not.toBeNull();
        expect(field.getAttribute("aria-expanded")).toBe("true");
        // Tall enough to tap, with text big enough that iOS doesn't zoom in.
        expect(textBox.classList).toContain("h-11");
        expect(textBox.classList).toContain("text-base");
        expect(sheet.querySelectorAll("[role='option']")).toHaveLength(4);
        expect(getPopupSurface().classList).toContain("[&_[role=option]]:min-h-11");
        // It keeps its height as the list filters, so the text box stays put.
        expect(sheet.querySelector("section")?.classList).toContain("h-dvh");
        const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("filters the list as the sheet's text box is typed in, and selects the match with Enter", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);

        await typeInSheet(fixture, "car");
        expect(getOptions().map(option => option.textContent?.trim())).toEqual(["Carrot"]);
        const textBox = getSheetTextBox();
        expect(textBox.getAttribute("aria-activedescendant")).toBe(getOptions()[0].id);
        // The field shows the same text.
        expect(getField(fixture).value).toBe("car");

        pressSheetKey("Enter");
        await settle(fixture);

        expect(fixture.componentInstance.fruit).toBe("Carrot");
        expect(getSheet(false)).toBeNull();
        expect(document.activeElement).toBe(getField(fixture));
        expect(getField(fixture).value).toBe("Carrot");
    });

    it("moves through the list with the arrow keys in the sheet's text box", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);

        pressSheetKey("ArrowDown");
        await settle(fixture);
        const highlighted = getSheetTextBox().getAttribute("aria-activedescendant");
        expect(document.getElementById(highlighted ?? "")?.textContent?.trim()).toBe("Carrot");

        pressSheetKey("Enter");
        await settle(fixture);
        expect(fixture.componentInstance.fruit).toBe("Carrot");
    });

    it("selects a tapped option, closes the sheet and gives focus back to the field", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);

        getOption("Date").click();
        await settle(fixture);

        expect(fixture.componentInstance.fruit).toBe("Date");
        expect(getSheet(false)).toBeNull();
        expect(document.activeElement).toBe(getField(fixture));
        expect(getField(fixture).getAttribute("aria-expanded")).toBe("false");
    });

    it("closes with Escape and brings back the selected item's text", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);
        await typeInSheet(fixture, "zz");

        pressSheetKey("Escape");
        await settle(fixture);

        expect(getSheet(false)).toBeNull();
        expect(fixture.componentInstance.fruit).toBe("Banana");
        expect(getField(fixture).value).toBe("Banana");
        expect(document.activeElement).toBe(getField(fixture));
    });

    it("reverts with Escape pressed before the filter catches up with the typing", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        await pressField(fixture);
        const textBox = getSheetTextBox();
        textBox.value = "zz";
        textBox.dispatchEvent(new Event("input", { bubbles: true }));

        pressSheetKey("Escape");
        await settle(fixture);

        expect(getSheet(false)).toBeNull();
        expect(getField(fixture).value).toBe("Banana");
    });

    it("offers typed text that matches no item when custom values are allowed", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        fixture.componentInstance.allowCustomValue.set(true);
        await settle(fixture);
        await pressField(fixture);
        await typeInSheet(fixture, "Elderberry");

        pressSheetKey("Enter");
        await settle(fixture);

        expect(fixture.componentInstance.added).toEqual(["Elderberry"]);
        expect(getSheet(false)).toBeNull();
    });

    it("moves text typed into the field with a keyboard to the sheet, which opens with it", async () => {
        stubSmallScreen(true);
        const fixture = await createFixture();
        const field = getField(fixture);
        field.focus();
        field.value = "D";
        field.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);

        const textBox = getSheetTextBox();
        expect(document.activeElement).toBe(textBox);
        expect(textBox.value).toBe("D");
        expect(textBox.selectionStart).toBe(1);
    });

    it("leaves the field to take typing on a wide screen, or without adaptiveMode", async () => {
        stubSmallScreen(false);
        const fixture = await createFixture();
        expect(getField(fixture).getAttribute("inputmode")).toBeNull();
        await pressField(fixture);
        expect(document.querySelector(".cdk-overlay-container [role='listbox']")).toBeNull();

        stubSmallScreen(true);
        fixture.componentInstance.adaptiveMode.set("none");
        await settle(fixture);
        expect(getField(fixture).getAttribute("inputmode")).toBeNull();
        await pressField(fixture);
        expect(document.querySelector(".cdk-overlay-container [role='listbox']")).toBeNull();

        const field = getField(fixture);
        field.focus();
        field.value = "Ap";
        field.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);
        expect(document.querySelector("mona-dropdown-sheet")).toBeNull();
        expect(document.querySelector(".cdk-overlay-container [role='listbox']")).not.toBeNull();
        expect(document.activeElement).toBe(field);
    });
});

async function createFixture(): Promise<ComponentFixture<AdaptiveComboBoxHostComponent>> {
    await TestBed.configureTestingModule({ imports: [AdaptiveComboBoxHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AdaptiveComboBoxHostComponent);
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
    return (fixture.nativeElement as HTMLElement).querySelector("mona-combo-box input") as HTMLInputElement;
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

function getPopupSurface(): HTMLElement {
    return document.querySelector(".cdk-overlay-container mona-list")?.parentElement as HTMLElement;
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
