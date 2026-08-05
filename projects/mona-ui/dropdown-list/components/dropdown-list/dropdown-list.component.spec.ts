import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
    disabled as fieldDisabled,
    form,
    FormField,
    readonly as fieldReadonly,
    required
} from "@angular/forms/signals";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DropdownListValueTemplateDirective } from "../../directives/dropdown-list-value-template.directive";
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
class ObjectModeHostComponent {
    readonly #formModel = signal<DropdownListFormModel>({ value: FOOD_ITEMS[1] });
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
        <mona-dropdown-list
            [data]="data()"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [loading]="loading()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-dropdown-list>
    `,
    imports: [DropdownListComponent, FormField]
})
class PrimitiveModeHostComponent {
    readonly #formModel = signal<PrimitiveDropdownListFormModel>({ value: 2 });
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
        <mona-dropdown-list
            [data]="data"
            textField="text"
            valueField="value"
            [valuePrimitive]="true"
            [(value)]="selectedId">
        </mona-dropdown-list>
    `,
    imports: [DropdownListComponent]
})
class PrimitiveTwoWayHostComponent {
    protected readonly data = FOOD_ITEMS;
    public selectedId: number | null = 2;
}

@Component({
    template: `
        <mona-dropdown-list
            [data]="data"
            textField="text"
            valueField="value"
            [(value)]="selected">
            <ng-template monaDropDownListValueTemplate let-item>
                <span>{{ item.text }}:{{ item.value }}</span>
            </ng-template>
        </mona-dropdown-list>
    `,
    imports: [DropdownListComponent, DropdownListValueTemplateDirective]
})
class ObjectTwoWayHostComponent {
    protected readonly data = FOOD_ITEMS;
    public selected: FoodItem | null = FOOD_ITEMS[2];
}

@Component({
    template: `
        <mona-dropdown-list
            [data]="data"
            textField="text"
            [valueField]="valueField"
            [valuePrimitive]="true"
            [(value)]="selectedId">
        </mona-dropdown-list>
    `,
    imports: [DropdownListComponent]
})
class FunctionValueFieldHostComponent {
    protected readonly data = FOOD_ITEMS;
    protected readonly valueField = (item: FoodItem) => item.value;
    public selectedId: number | null = 2;
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
        const fixture = await createObjectModeFixture();
        const host = getHost(fixture);

        expect(
            host.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(host.classList.contains("border-input-border")).toBe(true);
        expect(host.classList.contains("hover:bg-hover")).toBe(true);
        expect(host.classList.contains("active:bg-active")).toBe(true);
        expect(host.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(host.classList.contains("hover:bg-accent")).toBe(false);
    });

    it("uses an overlay popup and neutral persistent option selection", async () => {
        const fixture = await createObjectModeFixture();
        await openPopup(fixture);

        const selectedOption = getOption("Banana");
        const popup = selectedOption.closest("mona-list")?.parentElement as HTMLElement;

        expect(popup).not.toBeNull();
        expect(popup.classList.contains("border-border")).toBe(true);
        expect(popup.classList.contains("shadow-(--shadow-overlay)")).toBe(true);
        expect(
            popup.classList.contains(
                "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
            )
        ).toBe(true);
        expect(
            popup.classList.contains(
                "[background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
            )
        ).toBe(false);
        expect(
            popup.classList.contains(
                "[&_mona-list]:[background-color:var(--mona-dropdown-popup-list-background,var(--mona-list-background))]!"
            )
        ).toBe(true);
        expect(selectedOption.classList.contains("bg-(--color-selected)")).toBe(true);
        expect(selectedOption.classList.contains("text-(--color-selected-foreground)")).toBe(true);
        expect(selectedOption.classList.contains("bg-primary")).toBe(false);
        expect(selectedOption.classList.contains("bg-accent-hover")).toBe(false);
    });

    describe("object mode", () => {
        it("renders the initial object value", async () => {
            const fixture = await createObjectModeFixture();

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
        });

        it("valuePrimitive defaults to false", async () => {
            const fixture = await createObjectModeFixture();

            expect(getDropdownListComponent(fixture).valuePrimitive()).toBe(false);
        });

        it("selecting another option writes the complete object", async () => {
            const fixture = await createObjectModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[2]);
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createObjectModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
        });

        it("writes the complete object through a two-way value binding", async () => {
            const fixture = await createObjectFixture(ObjectTwoWayHostComponent);

            await openPopup(fixture);
            getOption("Date").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.selected).toEqual(FOOD_ITEMS[3]);
        });

        it("passes the complete object to the value template", async () => {
            const fixture = await createObjectFixture(ObjectTwoWayHostComponent);

            expect(getHost(fixture).textContent).toContain("Carrot:3");
        });

        it("external object synchronization does not mark the field touched", async () => {
            const fixture = await createObjectModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set(FOOD_ITEMS[0]);
            await waitForStable(fixture);

            expect(field.value()).toEqual(FOOD_ITEMS[0]);
            expect(field.touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Apple");
        });
    });

    describe("primitive mode", () => {
        it("hydrates the rendered selection from a primitive value", async () => {
            const fixture = await createPrimitiveModeFixture();

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(fixture.componentInstance.form.value().value()).toBe(2);
        });

        it("writes the primitive value when an option is selected with the mouse", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("writes the primitive value when an option is selected with Enter", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            pressKey(fixture, "ArrowDown");
            pressKey(fixture, "Enter");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
        });

        it("writes the primitive value when navigating with arrows while the popup is closed", async () => {
            const fixture = await createPrimitiveModeFixture();

            pressKey(fixture, "ArrowDown");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("writes the primitive value for Home and End keys", async () => {
            const fixture = await createPrimitiveModeFixture();

            pressKey(fixture, "Home");
            await waitForStable(fixture);
            expect(fixture.componentInstance.form.value().value()).toBe(1);

            pressKey(fixture, "End");
            await waitForStable(fixture);
            expect(fixture.componentInstance.form.value().value()).toBe(0);
        });

        it("writes the primitive value when selecting through typeahead", async () => {
            const fixture = await createPrimitiveModeFixture();

            pressKey(fixture, "c");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
        });

        it("commits the navigated item when the popup closes", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            pressKey(fixture, "ArrowDown");
            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(3);
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createPrimitiveModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(fixture.componentInstance.form.value().touched()).toBe(true);
        });

        it("treats zero as a valid selected value", async () => {
            const fixture = await createPrimitiveModeFixture();

            await openPopup(fixture);
            getOption("Date").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe(0);
            expect(getHost(fixture).textContent).toContain("Date");
        });

        it("keeps an unmatched key in the form model and renders no selection", async () => {
            const fixture = await createPrimitiveModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set(99);
            await waitForStable(fixture);

            expect(field.value()).toBe(99);
            expect(field.touched()).toBe(false);
            expect(getHost(fixture).textContent).not.toContain("Banana");
        });

        it("hydrates the selection when data arrives asynchronously", async () => {
            const fixture = await createPrimitiveModeFixture();
            const host = fixture.componentInstance;

            host.data.set([]);
            await waitForStable(fixture);
            expect(getHost(fixture).textContent).not.toContain("Banana");

            host.data.set(FOOD_ITEMS);
            await waitForStable(fixture);

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(host.form.value().value()).toBe(2);
            expect(host.form.value().touched()).toBe(false);
        });

        it("preserves the selection when data objects are replaced with equivalent instances", async () => {
            const fixture = await createPrimitiveModeFixture();
            const host = fixture.componentInstance;
            const replacements: readonly FoodItem[] = [
                { text: "Apple v2", value: 1 },
                { text: "Banana v2", value: 2 },
                { text: "Carrot v2", value: 3 },
                { text: "Date v2", value: 0 }
            ];

            host.data.set(replacements);
            await waitForStable(fixture);

            expect(getHost(fixture).textContent).toContain("Banana v2");
            expect(host.form.value().value()).toBe(2);
            expect(host.form.value().touched()).toBe(false);
        });

        it("external primitive synchronization does not mark the field touched", async () => {
            const fixture = await createPrimitiveModeFixture();
            const field = fixture.componentInstance.form.value();

            field.value.set(3);
            await waitForStable(fixture);

            expect(field.value()).toBe(3);
            expect(field.touched()).toBe(false);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });

        it("infers the primitive value type from a two-way value binding", async () => {
            const fixture = await createObjectFixture(PrimitiveTwoWayHostComponent);

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.selectedId).toBe(3);
        });
    });

    describe("function-based valueField", () => {
        it("hydrates the selection and projects primitive values outbound", async () => {
            const fixture = await createObjectFixture(FunctionValueFieldHostComponent);

            expect(getHost(fixture).textContent).toContain("Banana");
            expect(fixture.componentInstance.selectedId).toBe(2);

            await openPopup(fixture);
            getOption("Carrot").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.selectedId).toBe(3);
            expect(getHost(fixture).textContent).toContain("Carrot");
        });
    });

    it("emits touch on blur", async () => {
        const fixture = await createObjectModeFixture();

        getHost(fixture).dispatchEvent(new FocusEvent("blur"));
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
        expect(getHost(fixture).getAttribute("aria-required")).toBe("true");
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

    it("does not report a required field as invalid when false is the selected value", async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownListComponent]
        }).compileComponents();

        @Component({
            template: `
                <mona-dropdown-list
                    [data]="data"
                    textField="text"
                    valueField="inStock"
                    [valuePrimitive]="true"
                    [required]="true"
                    [touched]="true"
                    [(value)]="selectedValue">
                </mona-dropdown-list>
            `,
            imports: [DropdownListComponent]
        })
        class BooleanHostComponent {
            protected readonly data: readonly StockItem[] = [
                { text: "Available", inStock: true },
                { text: "Sold out", inStock: false }
            ];
            public selectedValue: boolean | null = false;
        }

        const fixture = TestBed.createComponent(BooleanHostComponent);
        await waitForStable(fixture);

        expect(fixture.componentInstance.selectedValue).toBe(false);
        expect(getHost(fixture).getAttribute("aria-invalid")).toBeNull();
        expect(getHost(fixture).textContent).toContain("Sold out");
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

function pressKey(fixture: ComponentFixture<unknown>, key: string): void {
    getHost(fixture).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-dropdown-list") as HTMLElement;
}

function getDropdownListComponent(fixture: ComponentFixture<unknown>): DropdownListComponent {
    return fixture.debugElement.query(By.directive(DropdownListComponent)).componentInstance as DropdownListComponent;
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

interface StockItem {
    readonly text: string;
    readonly inStock: boolean;
}

interface DropdownListFormModel {
    value: FoodItem | null;
}

interface PrimitiveDropdownListFormModel {
    value: number | null;
}
