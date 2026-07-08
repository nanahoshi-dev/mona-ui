import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    disabled as fieldDisabled,
    form,
    FormField,
    readonly as fieldReadonly,
    required
} from "@angular/forms/signals";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MultiSelectVariantProps } from "../../styles/multi-select.styles";
import { MultiSelectComponent } from "./multi-select.component";

const FOOD_ITEMS: readonly FoodItem[] = [
    { text: "Apple", value: 1 },
    { text: "Banana", value: 2 },
    { text: "Carrot", value: 3 }
];

@Component({
    template: `
        <mona-multi-select
            [data]="data"
            textField="text"
            valueField="value"
            [loading]="loading()"
            [size]="size()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-multi-select>
    `,
    imports: [MultiSelectComponent, FormField]
})
class SignalFormMultiSelectHostComponent {
    readonly #formModel = signal<MultiSelectFormModel>({ value: [2] });
    protected readonly data = FOOD_ITEMS;
    public readonly disabled = signal(false);
    public readonly loading = signal(false);
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly size = signal<MultiSelectVariantProps["size"]>("medium");
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
        fieldReadonly(schema.value, { when: () => this.readonlyState() });
        required(schema.value, { when: () => this.requiredState() });
    });
}

describe("MultiSelectComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => clearOverlays());

    it("creates", async () => {
        await TestBed.configureTestingModule({
            imports: [MultiSelectComponent, BrowserAnimationsModule]
        }).compileComponents();

        const fixture = TestBed.createComponent(MultiSelectComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    it("hydrates selected tags from a signal form primitive valueField array", async () => {
        const fixture = await createSignalFormFixture();

        expect(getHost(fixture).textContent).toContain("Banana");
        expect(fixture.componentInstance.form.value().value()).toEqual([2]);
    });

    it("updates the signal form value and touched state when an option is selected", async () => {
        const fixture = await createSignalFormFixture();

        await openPopup(fixture);
        getOption("Carrot").click();
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toEqual([FOOD_ITEMS[1], FOOD_ITEMS[2]]);
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
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toEqual([2]);
    });

    it("reflects readonly state and does not open the popup", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.readonlyState.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toEqual([2]);
    });

    it("clears the signal form value from the clear button", async () => {
        const fixture = await createSignalFormFixture();

        getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toEqual([]);
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
        expect(getIndicator(fixture, "loading")?.classList.contains("h-9")).toBe(true);
        expect(getIndicator(fixture, "loading")?.classList.contains("self-center")).toBe(true);
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("sizes indicators to the multi select row height", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.size.set("large");
        fixture.componentInstance.loading.set(true);
        await waitForStable(fixture);

        expect(getIndicator(fixture, "loading")?.classList.contains("h-10")).toBe(true);
        expect(getIndicator(fixture, "toggle")?.classList.contains("h-10")).toBe(true);
    });

    it("reflects required invalid state from signal forms", async () => {
        const fixture = await createSignalFormFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set([]);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getHost(fixture).getAttribute("aria-required")).toBe("true");
    });
});

async function createSignalFormFixture(): Promise<ComponentFixture<SignalFormMultiSelectHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormMultiSelectHostComponent, BrowserAnimationsModule]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormMultiSelectHostComponent);
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
    return fixture.nativeElement.querySelector("mona-multi-select") as HTMLElement;
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

interface MultiSelectFormModel {
    value: Array<FoodItem | number>;
}
