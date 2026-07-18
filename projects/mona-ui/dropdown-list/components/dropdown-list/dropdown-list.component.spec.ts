import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    disabled as fieldDisabled,
    form,
    FormField,
    readonly as fieldReadonly,
    required
} from "@angular/forms/signals";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DropdownListComponent } from "./dropdown-list.component";

const FOOD_ITEMS: readonly FoodItem[] = [
    { text: "Apple", value: 1 },
    { text: "Banana", value: 2 },
    { text: "Carrot", value: 3 },
    { text: "Date", value: 0 }
];

@Component({
    template: `
        <mona-dropdown-list
            [data]="data"
            textField="text"
            valueField="value"
            [loading]="loading()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-dropdown-list>
    `,
    imports: [DropdownListComponent, FormField]
})
class SignalFormDropdownListHostComponent {
    readonly #formModel = signal<DropdownListFormModel>({ value: 2 });
    protected readonly data = FOOD_ITEMS;
    public readonly disabled = signal(false);
    public readonly loading = signal(false);
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
        fieldReadonly(schema.value, { when: () => this.readonlyState() });
        required(schema.value, { when: () => this.requiredState() });
    });
}

describe("DropdownListComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => clearOverlays());

    it("creates", async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownListComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(DropdownListComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    it("uses a neutral input shell and keeps invalid focus precedence", async () => {
        const fixture = await createSignalFormFixture();
        const host = getHost(fixture);

        expect(host.classList.contains("bg-input-background")).toBe(true);
        expect(host.classList.contains("border-input-border")).toBe(true);
        expect(host.classList.contains("hover:bg-hover")).toBe(true);
        expect(host.classList.contains("active:bg-active")).toBe(true);
        expect(host.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(host.classList.contains("hover:bg-accent")).toBe(false);
    });

    it("uses an overlay popup and neutral persistent option selection", async () => {
        const fixture = await createSignalFormFixture();
        await openPopup(fixture);

        const popup = document.body.querySelector(".bg-surface-overlay") as HTMLElement;
        const selectedOption = getOption("Banana");

        expect(popup).not.toBeNull();
        expect(popup.classList.contains("border-border")).toBe(true);
        expect(popup.classList.contains("shadow-(--shadow-overlay)")).toBe(true);
        expect(popup.classList.contains("bg-surface-raised")).toBe(false);
        expect(selectedOption.classList.contains("bg-active")).toBe(true);
        expect(selectedOption.classList.contains("bg-primary")).toBe(false);
        expect(selectedOption.classList.contains("bg-accent-hover")).toBe(false);
    });

    it("hydrates the rendered selection from a signal form primitive valueField value", async () => {
        const fixture = await createSignalFormFixture();

        expect(getHost(fixture).textContent).toContain("Banana");
        expect(fixture.componentInstance.form.value().value()).toBe(2);
    });

    it("updates the signal form value and touched state when an option is selected", async () => {
        const fixture = await createSignalFormFixture();

        await openPopup(fixture);
        getOption("Carrot").click();
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[2]);
        expect(fixture.componentInstance.form.value().touched()).toBe(true);
        expect(getHost(fixture).textContent).toContain("Carrot");
    });

    it("emits touch on blur", async () => {
        const fixture = await createSignalFormFixture();

        getHost(fixture).dispatchEvent(new FocusEvent("blur"));
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().touched()).toBe(true);
    });

    it("reflects disabled state and does not open the popup", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.disabled.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-disabled")).toBe("true");
        expect(getHost(fixture).getAttribute("data-disabled")).toBe("true");
        expect(getHost(fixture).classList.contains("bg-disabled-background")).toBe(true);
        expect(getHost(fixture).classList.contains("border-disabled-border")).toBe(true);
        expect(getHost(fixture).classList.contains("text-disabled-foreground")).toBe(true);
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toBe(2);
    });

    it("reflects readonly state and does not open the popup", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.readonlyState.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getHost(fixture).getAttribute("data-readonly")).toBe("true");
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toBe(2);
    });

    it("clears the signal form value from the clear button", async () => {
        const fixture = await createSignalFormFixture();

        getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toBeNull();
        expect(fixture.componentInstance.form.value().touched()).toBe(true);
    });

    it("renders clear and toggle indicators when a value is selected and not loading", async () => {
        const fixture = await createSignalFormFixture();

        expect(getIndicator(fixture, "clear")).toBeTruthy();
        expect(getIndicator(fixture, "loading")).toBeNull();
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("renders the loading indicator instead of the clear indicator while loading", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.loading.set(true);
        await waitForStable(fixture);

        expect(getIndicator(fixture, "clear")).toBeNull();
        expect(getIndicator(fixture, "loading")).toBeTruthy();
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("reflects required invalid state from signal forms", async () => {
        const fixture = await createSignalFormFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set(null);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(field.invalid()).toBe(true);
        expect(getHost(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getHost(fixture).getAttribute("aria-required")).toBe("true");
        expect(getHost(fixture).className).toContain("border-error");
        expect(getHost(fixture).className).toContain("focus-within:ring-error/35");
    });

    it("does not report a required field as invalid when a falsy primitive value is selected", async () => {
        const fixture = await createSignalFormFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set(0);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-invalid")).toBeNull();
        expect(getHost(fixture).className).not.toContain("border-error");
    });

    it("falls back the accessible name to the placeholder when no aria-label is provided", async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownListComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(DropdownListComponent);
        fixture.componentRef.setInput("placeholder", "Select a food");
        fixture.detectChanges();

        expect(fixture.nativeElement.getAttribute("aria-label")).toBe("Select a food");
    });
});

async function createSignalFormFixture(): Promise<ComponentFixture<SignalFormDropdownListHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormDropdownListHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormDropdownListHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function openPopup(fixture: ComponentFixture<unknown>): Promise<void> {
    getHost(fixture).click();
    await waitForStable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-dropdown-list") as HTMLElement;
}

function getClearButton(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-indicator-icon[preset='clear']") as HTMLElement;
}

function getIndicator(fixture: ComponentFixture<unknown>, kind: "clear" | "loading" | "toggle"): HTMLElement | null {
    const preset = kind === "toggle" ? "dropdown" : kind;
    return fixture.nativeElement.querySelector(`mona-indicator-icon[preset='${preset}']`);
}

function getOptions(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll("li[role='option']")) as HTMLElement[];
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

interface FoodItem {
    readonly text: string;
    readonly value: number;
}

interface DropdownListFormModel {
    value: FoodItem | number | null;
}
