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

import { ComboBoxComponent } from "./combo-box.component";

const FOOD_ITEMS: readonly FoodItem[] = [
    { text: "Apple", value: 1 },
    { text: "Banana", value: 2 },
    { text: "Carrot", value: 3 },
    { text: "Date", value: 0 }
];

@Component({
    template: `
        <mona-combo-box
            [data]="data"
            textField="text"
            valueField="value"
            [loading]="loading()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-combo-box>
    `,
    imports: [ComboBoxComponent, FormField]
})
class ObjectModeHostComponent {
    readonly #formModel = signal<ComboBoxFormModel>({ value: FOOD_ITEMS[1] });
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

@Component({
    template: `
        <mona-combo-box
            [data]="data()"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [loading]="loading()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-combo-box>
    `,
    imports: [ComboBoxComponent, FormField]
})
class PrimitiveModeHostComponent {
    readonly #formModel = signal<PrimitiveComboBoxFormModel>({ value: 2 });
    public readonly data = signal<readonly FoodItem[]>(FOOD_ITEMS);
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

@Component({
    template: `
        <mona-combo-box
            [data]="data"
            textField="text"
            valueField="value"
            [allowCustomValue]="true"
            (valueAdd)="onValueAdd($event)">
        </mona-combo-box>
    `,
    imports: [ComboBoxComponent]
})
class CustomValueHostComponent {
    protected readonly data = FOOD_ITEMS;
    public addedValue: string | null = null;

    public onValueAdd(value: string): void {
        this.addedValue = value;
    }
}

describe("ComboBoxComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => clearOverlays());

    it("creates", async () => {
        await TestBed.configureTestingModule({
            imports: [ComboBoxComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(ComboBoxComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    it("uses the shared input shell and semantic state precedence", async () => {
        const fixture = await createObjectModeFixture();
        const host = getHost(fixture);

        expect(
            host.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(host.classList.contains("border-input-border")).toBe(true);
        expect(host.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(host.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(host.classList.contains("opacity-50")).toBe(false);
    });

    describe("object mode", () => {
        it("displays the initial object value text", async () => {
            const fixture = await createObjectModeFixture();

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
        });

        it("writes the complete object when an existing item is selected", async () => {
            const fixture = await createObjectModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[2]);
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createObjectModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getInput(fixture).value).toBe("");
        });

        it("escape restores the object-backed selection display", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "X");
            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
        });
    });

    describe("primitive mode", () => {
        it("hydrates the input text from a primitive value", async () => {
            const fixture = await createPrimitiveModeFixture();

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toBe(2);
        });

        it("writes the primitive value when an option is selected with the mouse", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("writes the primitive value when an option is committed with Enter", async () => {
            const fixture = await createPrimitiveModeFixture();

            await typeText(fixture, "Car");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("writes the primitive value for an exact text match", async () => {
            const fixture = await createPrimitiveModeFixture();

            await typeText(fixture, "Carrot");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
        });

        it("writes the primitive value when selecting with arrows and Enter", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            pressKey(fixture, "ArrowDown");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("escape does not replace the primitive value with an object", async () => {
            const fixture = await createPrimitiveModeFixture();

            await typeText(fixture, "X");
            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toBe(2);
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createPrimitiveModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getInput(fixture).value).toBe("");
        });

        it("treats zero as a valid selected value", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            getOption("Date").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(0);
            expect(getInput(fixture).value).toBe("Date");
        });

        it("hydrates the display text when data arrives asynchronously", async () => {
            const fixture = await createPrimitiveModeFixture();
            const host = fixture.componentInstance;

            host.data.set([]);
            await waitForStable(fixture);

            host.data.set(FOOD_ITEMS);
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("Banana");
            expect(host.form.value().value()).toBe(2);
            expect(host.form.value().touched()).toBe(false);
        });

        it("external primitive synchronization does not mark the field touched", async () => {
            const fixture = await createPrimitiveModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set(3);
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("Carrot");
            expect(field.touched()).toBe(false);
        });
    });

    describe("custom values", () => {
        it("valueAdd emits the unmatched text and leaves the model unchanged", async () => {
            const fixture = await createObjectFixture(CustomValueHostComponent);

            await typeText(fixture, "Pineapple");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.addedValue).toBe("Pineapple");
        });
    });

    it("emits touch on input blur", async () => {
        const fixture = await createObjectModeFixture();

        getInput(fixture).dispatchEvent(new FocusEvent("blur"));
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().touched()).toBe(true);
    });

    it("reflects disabled state and does not open the popup", async () => {
        const fixture = await createPrimitiveModeFixture();
        fixture.componentInstance.disabled.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-disabled")).toBe("true");
        expect(getHost(fixture).getAttribute("data-disabled")).toBe("true");
        expect(getHost(fixture).classList.contains("bg-disabled-background")).toBe(true);
        expect(getHost(fixture).classList.contains("border-disabled-border")).toBe(true);
        expect(getHost(fixture).classList.contains("text-disabled-foreground")).toBe(true);
        expect(getInput(fixture).disabled).toBe(true);
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toBe(2);
    });

    it("reflects readonly state and does not open the popup", async () => {
        const fixture = await createPrimitiveModeFixture();
        fixture.componentInstance.readonlyState.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getHost(fixture).getAttribute("data-readonly")).toBe("true");
        expect(getInput(fixture).readOnly).toBe(true);
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toBe(2);
    });

    it("renders clear and toggle indicators when a value is selected and not loading", async () => {
        const fixture = await createObjectModeFixture();

        expect(getIndicator(fixture, "clear")).toBeTruthy();
        expect(getIndicator(fixture, "loading")).toBeNull();
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("renders the loading indicator instead of the clear indicator while loading", async () => {
        const fixture = await createObjectModeFixture();
        fixture.componentInstance.loading.set(true);
        await waitForStable(fixture);

        expect(getIndicator(fixture, "clear")).toBeNull();
        expect(getIndicator(fixture, "loading")).toBeTruthy();
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("reflects required invalid state from signal forms", async () => {
        const fixture = await createObjectModeFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set(null);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(field.invalid()).toBe(true);
        expect(getHost(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getInput(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getHost(fixture).className).toContain("border-error");
        expect(getHost(fixture).className).toContain("focus-within:ring-error/35");
    });

    it("does not report a required field as invalid when a falsy primitive value is selected", async () => {
        const fixture = await createPrimitiveModeFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set(0);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-invalid")).toBeNull();
        expect(getHost(fixture).className).not.toContain("border-error");
    });

    it("falls back the input's accessible name to the placeholder when no aria-label is provided", async () => {
        await TestBed.configureTestingModule({
            imports: [ComboBoxComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(ComboBoxComponent);
        fixture.componentRef.setInput("placeholder", "Select a food");
        fixture.detectChanges();

        expect(getInput(fixture).getAttribute("aria-label")).toBe("Select a food");
    });

    it("exposes a single combobox role and tab stop on the input, not the host", async () => {
        const fixture = await createObjectModeFixture();

        expect(getHost(fixture).getAttribute("role")).toBeNull();
        expect(getHost(fixture).getAttribute("tabindex")).toBe("-1");
        expect(getInput(fixture).getAttribute("role")).toBe("combobox");
        expect(getHost(fixture).querySelectorAll("[role='combobox']").length).toBe(1);
    });
});

async function createObjectModeFixture(): Promise<ComponentFixture<ObjectModeHostComponent>> {
    return createSignalFormFixture(ObjectModeHostComponent);
}

async function createPrimitiveModeFixture(): Promise<ComponentFixture<PrimitiveModeHostComponent>> {
    return createSignalFormFixture(PrimitiveModeHostComponent);
}

async function createSignalFormFixture<T>(component: new () => T): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({
        imports: [component]
    }).compileComponents();

    const fixture = TestBed.createComponent(component);
    await waitForStable(fixture);
    return fixture;
}

async function createObjectFixture<T>(component: new () => T): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({
        imports: [component]
    }).compileComponents();

    const fixture = TestBed.createComponent(component);
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

async function typeText(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

function pressKey(fixture: ComponentFixture<unknown>, key: string): void {
    const input = getInput(fixture);
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-combo-box") as HTMLElement;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.nativeElement.querySelector("input") as HTMLInputElement;
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

interface ComboBoxFormModel {
    value: FoodItem | null;
}

interface PrimitiveComboBoxFormModel {
    value: number | null;
}
