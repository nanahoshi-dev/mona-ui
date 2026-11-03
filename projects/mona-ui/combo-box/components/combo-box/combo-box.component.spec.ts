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
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";

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

@Component({
    template: `
        <label for="food-input">Food</label>
        <mona-combo-box
            inputId="food-input"
            aria-describedby="food-help"
            aria-label="Favourite food"
            disabled
            readonly
            required
            showClearButton
            textField="text"
            [data]="data"></mona-combo-box>
        <span id="food-help">Pick a food</span>
    `,
    imports: [ComboBoxComponent]
})
class AttributeComboBoxHostComponent {
    protected readonly data = FOOD_ITEMS;
}

@Component({
    template: `
        <label for="food-input">Food</label>
        <mona-combo-box inputId="food-input" textField="text" [data]="data" [required]="true"></mona-combo-box>
    `,
    imports: [ComboBoxComponent]
})
class LabelledComboBoxHostComponent {
    protected readonly data = FOOD_ITEMS;
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
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("clears the signal form value from the clear button", async () => {
            const fixture = await createObjectModeFixture();

            getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
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
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
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
            expect(fixture.componentInstance.form.value().touched()).toBe(false);
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

    it("emits touch when focus leaves the combo box", async () => {
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

        expect(getHost(fixture).hasAttribute("aria-disabled")).toBe(false);
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

        expect(getHost(fixture).hasAttribute("aria-readonly")).toBe(false);
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
        expect(getHost(fixture).hasAttribute("aria-invalid")).toBe(false);
        expect(getHost(fixture).hasAttribute("aria-required")).toBe(false);
        expect(getInput(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(getInput(fixture).required).toBe(true);
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

        expect(getInput(fixture).getAttribute("aria-invalid")).toBeNull();
        expect(getHost(fixture).className).not.toContain("border-error");
    });

    it("leaves the input's name to its placeholder when no label is given", async () => {
        await TestBed.configureTestingModule({
            imports: [ComboBoxComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(ComboBoxComponent);
        fixture.componentRef.setInput("placeholder", "Select a food");
        fixture.detectChanges();

        // An aria-label copied from the placeholder would hide a <label for> pointed at inputId.
        expect(getInput(fixture).hasAttribute("aria-label")).toBe(false);
        expect(getInput(fixture).placeholder).toBe("Select a food");
    });

    it("exposes a single combobox role and tab stop on the input, not the host", async () => {
        const fixture = await createObjectModeFixture();

        expect(getHost(fixture).getAttribute("role")).toBeNull();
        expect(getHost(fixture).getAttribute("tabindex")).toBe("-1");
        expect(getInput(fixture).getAttribute("role")).toBe("combobox");
        expect(getHost(fixture).querySelectorAll("[role='combobox']").length).toBe(1);
    });

    describe("leaving the field", () => {
        it("restores the selected item's text when the typed text matches nothing", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "Bananazzz");
            await leaveField(fixture);

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
        });

        it("restores the selected item's text when the typed text only starts an item", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "Car");
            await leaveField(fixture);

            expect(getInput(fixture).value).toBe("Banana");
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
        });

        it("selects the item whose text matches, ignoring case", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "carrot");
            await leaveField(fixture);

            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[2]);
            expect(getInput(fixture).value).toBe("Carrot");
        });

        it("clears the value when the text was deleted", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "");
            await leaveField(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(getInput(fixture).value).toBe("");
        });

        it("offers unmatched text through valueAdd when custom values are allowed", async () => {
            const fixture = await createObjectFixture(CustomValueHostComponent);

            await typeText(fixture, "Kiwi");
            await leaveField(fixture);

            expect(fixture.componentInstance.addedValue).toBe("Kiwi");
        });

        it("leaves the text alone while focus moves to the clear button", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "Bananazzz");
            getInput(fixture).dispatchEvent(
                new FocusEvent("focusout", { bubbles: true, relatedTarget: getClearButton(fixture) })
            );
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("Bananazzz");
        });
    });

    describe("focus", () => {
        it("lets focus stay on the clear button", async () => {
            const fixture = await createObjectModeFixture();
            const clearButton = getClearButton(fixture);

            getInput(fixture).focus();
            clearButton.focus();
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(document.activeElement).toBe(clearButton);
        });

        it("focuses the input when the arrow is pressed", async () => {
            const fixture = await createObjectModeFixture();
            const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });

            getIndicator(fixture, "toggle")!.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(getInput(fixture));
        });

        it("leaves a press on the clear button to the button", async () => {
            const fixture = await createObjectModeFixture();
            const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });

            getClearButton(fixture).dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
        });

        it("focuses a read-only combo box through focus()", async () => {
            const fixture = await createObjectModeFixture();
            fixture.componentInstance.readonlyState.set(true);
            await waitForStable(fixture);

            fixture.debugElement.query(By.directive(ComboBoxComponent)).componentInstance.focus();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(document.activeElement).toBe(getInput(fixture));
        });
    });

    describe("keyboard", () => {
        it("ignores Enter while an IME is composing", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "car");
            const event = new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true,
                isComposing: true
            });
            getInput(fixture).dispatchEvent(event);
            await waitForStable(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.form.value().value()).toEqual(FOOD_ITEMS[1]);
            expect(getInput(fixture).getAttribute("aria-expanded")).toBe("true");
        });

        it("keeps an Escape that clears the field from closing a surrounding dialog", async () => {
            const fixture = await createObjectModeFixture();
            const escapes = countDocumentEscapes();

            pressKey(fixture, "Escape");
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(escapes.stop()).toBe(0);
        });

        it("lets Escape through when there is nothing to clear", async () => {
            const fixture = await createObjectModeFixture();
            pressKey(fixture, "Escape");
            await waitForStable(fixture);
            const escapes = countDocumentEscapes();

            pressKey(fixture, "Escape");

            expect(escapes.stop()).toBe(1);
        });
    });

    describe("clear button state", () => {
        it("is hidden on a read-only combo box", async () => {
            const fixture = await createObjectModeFixture();
            fixture.componentInstance.readonlyState.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });

        it("is hidden on a disabled combo box", async () => {
            const fixture = await createObjectModeFixture();
            fixture.componentInstance.disabled.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });
    });

    describe("forms and accessibility", () => {
        it("marks the field touched only when focus leaves, not on typing or the clear button", async () => {
            const fixture = await createObjectModeFixture();
            const field = fixture.componentInstance.form.value();

            await typeText(fixture, "Car");
            getInput(fixture).dispatchEvent(
                new FocusEvent("focusout", { bubbles: true, relatedTarget: getClearButton(fixture) })
            );
            await waitForStable(fixture);
            expect(field.touched()).toBe(false);

            await leaveField(fixture);
            expect(field.touched()).toBe(true);
        });

        it("applies disabled to the input in the same change detection pass", async () => {
            await TestBed.configureTestingModule({
                imports: [ComboBoxComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(ComboBoxComponent);
            fixture.detectChanges();

            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getInput(fixture).disabled).toBe(true);
        });

        it("writes the reverted text back to the input", async () => {
            const fixture = await createObjectModeFixture();

            await typeText(fixture, "Zzz");
            await leaveField(fixture);

            expect(getInput(fixture).value).toBe("Banana");
        });

        it("accepts bare boolean attributes and moves the state to the input", async () => {
            const fixture = await createObjectFixture(AttributeComboBoxHostComponent);
            const input = getInput(fixture);

            expect(input.disabled).toBe(true);
            expect(input.readOnly).toBe(true);
            expect(input.required).toBe(true);
            expect(getHost(fixture).getAttribute("data-disabled")).toBe("true");
        });

        it("labels the input through inputId and keeps the host free of ARIA", async () => {
            const fixture = await createObjectFixture(AttributeComboBoxHostComponent);
            const input = getInput(fixture);
            const host = getHost(fixture);

            expect(input.id).toBe("food-input");
            expect(input.labels?.[0]?.textContent).toBe("Food");
            expect(input.getAttribute("aria-describedby")).toBe("food-help");
            expect(input.getAttribute("aria-label")).toBe("Favourite food");
            expect(Array.from(host.attributes).filter(a => a.name.startsWith("aria-"))).toEqual([]);
        });

        it("renders no live region inside the field", async () => {
            const fixture = await createObjectModeFixture();

            expect(getHost(fixture).querySelector("[aria-live]")).toBeNull();
        });

        it("has no AXE violations when labelled with <label for> and required", async () => {
            const fixture = await createObjectFixture(LabelledComboBoxHostComponent);

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
                    comboBox: {
                        clear: "Temizle"
                    }
                }
            });
            await waitForStable(fixture);

            const clearBtn = getClearButton(fixture);
            expect(clearBtn.getAttribute("aria-label")).toBe("Temizle");
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

async function typeText(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

async function leaveField(fixture: ComponentFixture<unknown>): Promise<void> {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    getInput(fixture).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }));
    outside.remove();
    await waitForStable(fixture);
}

function countDocumentEscapes(): { stop(): number } {
    let count = 0;
    const listener = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            count++;
        }
    };
    document.addEventListener("keydown", listener);
    return {
        stop: () => {
            document.removeEventListener("keydown", listener);
            return count;
        }
    };
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
