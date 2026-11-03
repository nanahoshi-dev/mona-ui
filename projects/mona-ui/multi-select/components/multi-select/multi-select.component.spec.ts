import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import {
    disabled as fieldDisabled,
    form,
    FormField,
    readonly as fieldReadonly,
    required
} from "@angular/forms/signals";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";

import type { MultiSelectVariantProps } from "../../styles/multi-select.styles";
import { MultiSelectSummaryTagDirective } from "../../directives/multi-select-summary-tag.directive";
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
class ObjectModeHostComponent {
    readonly #formModel = signal<MultiSelectFormModel>({ value: [FOOD_ITEMS[1]] });
    protected readonly data = FOOD_ITEMS;
    public readonly disabled = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
        fieldReadonly(schema.value, { when: () => this.readonlyState() });
        required(schema.value, { when: () => this.requiredState() });
    });
    public readonly loading = signal(false);
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly size = signal<MultiSelectVariantProps["size"]>("medium");
}

@Component({
    template: `
        <mona-multi-select
            [data]="data()"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [loading]="loading()"
            [size]="size()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-multi-select>
    `,
    imports: [MultiSelectComponent, FormField]
})
class PrimitiveModeHostComponent {
    readonly #formModel = signal<PrimitiveMultiSelectFormModel>({ value: [2] });
    public readonly data = signal<readonly FoodItem[]>(FOOD_ITEMS);
    public readonly disabled = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
        fieldReadonly(schema.value, { when: () => this.readonlyState() });
        required(schema.value, { when: () => this.requiredState() });
    });
    public readonly loading = signal(false);
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly size = signal<MultiSelectVariantProps["size"]>("medium");
}

@Component({
    template: `
        <mona-multi-select
            [data]="data"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [checkboxes]="true"
            [(value)]="selectedValues">
        </mona-multi-select>
    `,
    imports: [MultiSelectComponent]
})
class CheckboxHostComponent {
    protected readonly data = FOOD_ITEMS;
    public selectedValues: number[] = [2];
}

@Component({
    template: `
        <mona-multi-select
            [data]="data"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [monaMultiSelectSummaryTag]="1"
            [(value)]="selectedValues">
        </mona-multi-select>
    `,
    imports: [MultiSelectComponent, MultiSelectSummaryTagDirective]
})
class SummaryTagHostComponent {
    protected readonly data = FOOD_ITEMS;
    public selectedValues: number[] = [2, 3, 1];
}

@Component({
    template: `
        <mona-multi-select
            aria-describedby="food-help"
            placeholder="Pick foods"
            disabled
            readonly
            required
            textField="text"
            [data]="data"></mona-multi-select>
        <span id="food-help">Pick one or more</span>
    `,
    imports: [MultiSelectComponent]
})
class AttributeMultiSelectHostComponent {
    protected readonly data = FOOD_ITEMS;
}

@Component({
    template: `
        <mona-multi-select
            placeholder="Pick foods"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [required]="true"
            [data]="data"
            [(value)]="selectedValues"></mona-multi-select>
    `,
    imports: [MultiSelectComponent]
})
class PlaceholderMultiSelectHostComponent {
    protected readonly data = FOOD_ITEMS;
    public selectedValues: number[] = [];
}

describe("MultiSelectComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => clearOverlays());

    it("creates", async () => {
        await TestBed.configureTestingModule({
            imports: [MultiSelectComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(MultiSelectComponent);
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
        it("renders tags for the initial object array", async () => {
            const fixture = await createObjectModeFixture();

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual([FOOD_ITEMS[1]]);
        });

        it("writes objects when an option is selected", async () => {
            const fixture = await createObjectModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([FOOD_ITEMS[1], FOOD_ITEMS[2]]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("writes the remaining objects when a tag is removed", async () => {
            const fixture = await createObjectModeFixture();
            await selectObjectOption(fixture, "Carrot");

            removeTag(fixture, "Banana");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([FOOD_ITEMS[2]]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("writes the remaining objects when the last tag is removed with Backspace", async () => {
            const fixture = await createObjectModeFixture();
            await selectObjectOption(fixture, "Carrot");

            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            pressKey(fixture, "Backspace");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([FOOD_ITEMS[1]]);
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createObjectModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("external object synchronization does not mark the field touched", async () => {
            const fixture = await createObjectModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set([FOOD_ITEMS[0]]);
            await waitForStable(fixture);

            expect(field.value()).toEqual([FOOD_ITEMS[0]]);
            expect(field.touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Apple");
        });
    });

    describe("primitive mode", () => {
        it("renders matching object tags for a primitive array", async () => {
            const fixture = await createPrimitiveModeFixture();

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual([2]);
        });

        it("writes primitive values when an option is selected", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([2, 3]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("writes primitive values when an option is selected via checkbox", async () => {
            const fixture = await createObjectFixture(CheckboxHostComponent);

            await openPopup(fixture);
            getOption("Apple").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.selectedValues).toEqual([2, 1]);
        });

        it("writes primitive values when an option is toggled with Enter", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            pressKey(fixture, "ArrowDown");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([2, 3]);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("writes the remaining primitive values when a tag is removed", async () => {
            const fixture = await createPrimitiveModeFixture();
            await selectPrimitiveOption(fixture, "Carrot");

            removeTag(fixture, "Banana");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([3]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("writes the remaining primitive values when the summary tag is removed", async () => {
            const fixture = await createObjectFixture(SummaryTagHostComponent);

            expect(getHost(fixture).textContent).toContain("+ 2 items");

            removeSummaryTag(fixture);
            await waitForStable(fixture);

            expect(fixture.componentInstance.selectedValues).toEqual([2]);
            expect(getHost(fixture).textContent).not.toContain("+ 2 items");
        });

        it("writes the remaining primitive values when the last tag is removed with Backspace", async () => {
            const fixture = await createPrimitiveModeFixture();
            await selectPrimitiveOption(fixture, "Carrot");

            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            pressKey(fixture, "Backspace");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([2]);
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createPrimitiveModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([]);
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("hydrates tags when primitive keys are set before data arrives", async () => {
            const fixture = await createPrimitiveModeFixture();
            const host = fixture.componentInstance;

            host.data.set([]);
            await waitForStable(fixture);
            expect(getHost(fixture).textContent).not.toContain("Banana");

            host.data.set(FOOD_ITEMS);
            await waitForStable(fixture);

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(host.form.value().value()).toEqual([2]);
            expect(host.form.value().touched()).toBe(false);
        });

        it("preserves tags when data objects are replaced with equivalent instances", async () => {
            const fixture = await createPrimitiveModeFixture();
            const host = fixture.componentInstance;
            const replacements: readonly FoodItem[] = [
                { text: "Apple v2", value: 1 },
                { text: "Banana v2", value: 2 },
                { text: "Carrot v2", value: 3 }
            ];

            host.data.set(replacements);
            await waitForStable(fixture);

            expect(getHost(fixture).textContent).toContain("Banana v2");
            expect(host.form.value().value()).toEqual([2]);
            expect(host.form.value().touched()).toBe(false);
        });

        it("external primitive synchronization does not mark the field touched", async () => {
            const fixture = await createPrimitiveModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set([3]);
            await waitForStable(fixture);

            expect(field.value()).toEqual([3]);
            expect(field.touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Carrot");
            expect(getHost(fixture).textContent).not.toContain("Banana");
        });
    });

    it("emits touch when focus leaves the multi select", async () => {
        const fixture = await createObjectModeFixture();

        await leaveField(fixture);

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
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toEqual([2]);
    });

    it("reflects readonly state and does not open the popup", async () => {
        const fixture = await createPrimitiveModeFixture();
        fixture.componentInstance.readonlyState.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getHost(fixture).getAttribute("data-readonly")).toBe("true");
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toEqual([2]);
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
        expect(getIndicator(fixture, "loading")?.classList.contains("h-9")).toBe(true);
        expect(getIndicator(fixture, "loading")?.classList.contains("self-center")).toBe(true);
        expect(getIndicator(fixture, "toggle")).toBeTruthy();
    });

    it("sizes indicators to the multi select row height", async () => {
        const fixture = await createObjectModeFixture();
        fixture.componentInstance.size.set("large");
        fixture.componentInstance.loading.set(true);
        await waitForStable(fixture);

        expect(getIndicator(fixture, "loading")?.classList.contains("h-10")).toBe(true);
        expect(getIndicator(fixture, "toggle")?.classList.contains("h-10")).toBe(true);
    });

    it("reflects required invalid state from signal forms", async () => {
        const fixture = await createObjectModeFixture();
        const field = fixture.componentInstance.form.value();
        fixture.componentInstance.requiredState.set(true);
        field.value.set([]);
        field.markAsTouched();
        await waitForStable(fixture);

        expect(getHost(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getHost(fixture).getAttribute("aria-required")).toBe("true");
        expect(getHost(fixture).className).toContain("focus-within:ring-error/35");
    });

    describe("clear button state", () => {
        it("is hidden on a read-only multi-select", async () => {
            const fixture = await createObjectModeFixture();
            fixture.componentInstance.readonlyState.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });

        it("is hidden on a disabled multi-select", async () => {
            const fixture = await createObjectModeFixture();
            fixture.componentInstance.disabled.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });
    });

    describe("keyboard", () => {
        it("toggles the highlighted option with Space while the popup is open", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            pressKey(fixture, "ArrowDown");
            pressKey(fixture, " ");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual([2, 3]);
            expect(getOptions().length).toBeGreaterThan(0);

            pressKey(fixture, " ");
            await waitForStable(fixture);
            expect(fixture.componentInstance.form.value().value()).toEqual([2]);
        });

        it("opens the popup with Space while it is closed", async () => {
            const fixture = await createPrimitiveModeFixture();

            pressKey(fixture, " ");
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);

            expect(getHost(fixture).getAttribute("aria-expanded")).toBe("true");
            expect(fixture.componentInstance.form.value().value()).toEqual([2]);
        });
    });

    describe("API", () => {
        it("passes focus options on to the host", async () => {
            await TestBed.configureTestingModule({
                imports: [MultiSelectComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(MultiSelectComponent);
            fixture.detectChanges();
            const host = fixture.nativeElement as HTMLElement;
            const focusSpy = vi.spyOn(host, "focus");

            fixture.componentInstance.focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        });
    });

    describe("forms and accessibility", () => {
        it("doesn't mark the field touched while focus moves to its clear button", async () => {
            const fixture = await createObjectModeFixture();

            await leaveField(fixture, getClearButton(fixture));

            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("names each chip's remove button after the item", async () => {
            const fixture = await createPrimitiveModeFixture();
            await selectPrimitiveOption(fixture, "Carrot");

            expect(getRemoveLabels(fixture)).toEqual(["Remove, Banana", "Remove, Carrot"]);
        });

        it("says how many items the summary chip removes", async () => {
            const fixture = await createObjectFixture(SummaryTagHostComponent);

            expect(getRemoveLabels(fixture)).toEqual(["Remove, Banana", "Remove 2 more items"]);
        });

        it("shows the placeholder while nothing is selected and uses it as the name", async () => {
            const fixture = await createObjectFixture(PlaceholderMultiSelectHostComponent);
            const host = getHost(fixture);

            expect(host.textContent).toContain("Pick foods");
            expect(host.getAttribute("aria-label")).toBe("Pick foods");

            await selectPrimitiveOption(fixture, "Apple");
            expect(host.querySelector("mona-chip")).not.toBeNull();
            expect(host.textContent).not.toContain("Pick foods");
        });

        it("accepts bare boolean attributes and links a description", async () => {
            const fixture = await createObjectFixture(AttributeMultiSelectHostComponent);
            const host = getHost(fixture);

            expect(host.getAttribute("aria-disabled")).toBe("true");
            expect(host.getAttribute("aria-readonly")).toBe("true");
            expect(host.getAttribute("aria-required")).toBe("true");
            expect(host.getAttribute("aria-describedby")).toBe("food-help");
            expect(host.hasAttribute("tabindex")).toBe(false);
        });

        it("keeps the result count out of the combobox's content", async () => {
            const fixture = await createObjectModeFixture();

            expect(getHost(fixture).querySelector("[aria-live]")).toBeNull();
            expect(getHost(fixture).textContent).not.toContain("result");
        });

        it("has no AXE violations with only a placeholder to name it", async () => {
            const fixture = await createObjectFixture(PlaceholderMultiSelectHostComponent);
            await selectPrimitiveOption(fixture, "Apple");
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });

            expect(results.violations).toEqual([]);
        });
    });

    describe("i18n", () => {
        it("renders default English clear label on indicator icon", async () => {
            const fixture = await createObjectModeFixture();
            const clearBtn = getClearButton(fixture);
            expect(clearBtn.getAttribute("aria-label")).toBe("Clear");
        });

        it("updates clear label dynamically when locale changes", async () => {
            const fixture = await createObjectModeFixture();
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    multiSelect: {
                        clear: "Temizle",
                        itemsCount: (count: number) => `+ ${count} öğe`
                    }
                }
            });
            await waitForStable(fixture);

            const clearBtn = getClearButton(fixture);
            expect(clearBtn.getAttribute("aria-label")).toBe("Temizle");
        });

        it("renders default English summary tag items count", async () => {
            const fixture = await createObjectFixture(SummaryTagHostComponent);
            expect(getHost(fixture).textContent).toContain("+ 2 items");
        });

        it("updates summary tag items count dynamically when locale changes", async () => {
            const fixture = await createObjectFixture(SummaryTagHostComponent);
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    multiSelect: {
                        clear: "Temizle",
                        itemsCount: (count: number) => `+ ${count} öğe`
                    }
                }
            });
            await waitForStable(fixture);

            expect(getHost(fixture).textContent).toContain("+ 2 öğe");
        });
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

async function selectObjectOption(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    await openPopup(fixture);
    getOption(text).click();
    await waitForStable(fixture);
}

async function selectPrimitiveOption(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    await openPopup(fixture);
    getOption(text).click();
    await waitForStable(fixture);
}

async function leaveField(fixture: ComponentFixture<unknown>, relatedTarget: EventTarget | null = null): Promise<void> {
    getHost(fixture).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
    await waitForStable(fixture);
}

function getRemoveLabels(fixture: ComponentFixture<unknown>): (string | null)[] {
    return Array.from(getHost(fixture).querySelectorAll("button[data-chip-remove]")).map(button =>
        button.getAttribute("aria-label")
    );
}

function pressKey(fixture: ComponentFixture<unknown>, key: string): void {
    getHost(fixture).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function removeTag(fixture: ComponentFixture<unknown>, text: string): void {
    const host = getHost(fixture);
    const chips = Array.from(host.querySelectorAll("mona-chip")) as HTMLElement[];
    const chip = chips.find(item => item.textContent?.includes(text));
    if (!chip) {
        throw new Error(`Chip not found: ${text}`);
    }
    const removeButton = chip.querySelector("button[data-chip-remove]") as HTMLElement | null;
    if (!removeButton) {
        throw new Error(`Remove button not found on chip: ${text}`);
    }
    removeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

function removeSummaryTag(fixture: ComponentFixture<unknown>): void {
    const host = getHost(fixture);
    const chips = Array.from(host.querySelectorAll("mona-chip")) as HTMLElement[];
    const summaryChip = chips.find(item => item.textContent?.includes("+"));
    if (!summaryChip) {
        throw new Error("Summary tag chip not found");
    }
    const removeButton = summaryChip.querySelector("button[data-chip-remove]") as HTMLElement | null;
    if (!removeButton) {
        throw new Error("Remove button not found on summary chip");
    }
    removeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
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
    value: FoodItem[];
}

interface PrimitiveMultiSelectFormModel {
    value: number[];
}
