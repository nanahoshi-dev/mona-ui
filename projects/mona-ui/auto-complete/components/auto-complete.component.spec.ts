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

import { AutoCompleteComponent } from "./auto-complete.component";

const FOOD_ITEMS: readonly FoodItem[] = [
    { text: "Apple", value: 1 },
    { text: "Banana", value: 2 },
    { text: "Carrot", value: 3 }
];

@Component({
    template: `
        <label for="food-input">Food</label>
        <mona-auto-complete
            inputId="food-input"
            aria-describedby="food-help"
            disabled
            readonly
            required
            showClearButton
            [data]="data"></mona-auto-complete>
        <span id="food-help">Pick a food</span>
    `,
    imports: [AutoCompleteComponent]
})
class AttributeAutoCompleteHostComponent {
    protected readonly data = FOOD_ITEMS;
}

@Component({
    template: `
        <mona-auto-complete
            [data]="data"
            textField="text"
            valueField="value"
            [loading]="loading()"
            [showClearButton]="true"
            [formField]="form.value">
        </mona-auto-complete>
    `,
    imports: [AutoCompleteComponent, FormField]
})
class SignalFormAutoCompleteHostComponent {
    readonly #formModel = signal<AutoCompleteFormModel>({ value: "Banana" });
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
}

describe("AutoCompleteComponent", () => {
    beforeEach(() => clearOverlays());
    afterEach(() => clearOverlays());

    it("creates", async () => {
        await TestBed.configureTestingModule({
            imports: [AutoCompleteComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(AutoCompleteComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    it("uses the shared input shell and semantic state precedence", async () => {
        const fixture = await createSignalFormFixture();
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

    it("hydrates the input from the signal form value", async () => {
        const fixture = await createSignalFormFixture();

        expect(getInput(fixture).value).toBe("Banana");
        expect(fixture.componentInstance.form.value().value()).toBe("Banana");
    });

    it("updates the signal form value when an option is selected, and marks it touched only on leaving", async () => {
        const fixture = await createSignalFormFixture();

        await openPopup(fixture);
        getOption("Carrot").click();
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toBe("Carrot");
        expect(fixture.componentInstance.form.value().touched()).toBe(false);
        expect(getInput(fixture).value).toBe("Carrot");

        await leaveField(fixture);
        expect(fixture.componentInstance.form.value().touched()).toBe(true);
    });

    it("emits touch when focus leaves the auto-complete", async () => {
        const fixture = await createSignalFormFixture();

        await leaveField(fixture);

        expect(fixture.componentInstance.form.value().touched()).toBe(true);
    });

    it("reflects disabled state and does not open the popup", async () => {
        const fixture = await createSignalFormFixture();
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
        expect(fixture.componentInstance.form.value().value()).toBe("Banana");
    });

    it("reflects readonly state and does not open the popup", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.readonlyState.set(true);
        await waitForStable(fixture);

        getHost(fixture).click();
        await waitForStable(fixture);

        expect(getHost(fixture).hasAttribute("aria-readonly")).toBe(false);
        expect(getHost(fixture).getAttribute("data-readonly")).toBe("true");
        expect(getInput(fixture).readOnly).toBe(true);
        expect(getOptions().length).toBe(0);
        expect(fixture.componentInstance.form.value().value()).toBe("Banana");
    });

    it("clears the signal form value from the clear button", async () => {
        const fixture = await createSignalFormFixture();

        getClearButton(fixture).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await waitForStable(fixture);

        expect(fixture.componentInstance.form.value().value()).toBeNull();
        expect(fixture.componentInstance.form.value().touched()).toBe(false);
        expect(getInput(fixture).value).toBe("");
    });

    it("renders the clear indicator without a toggle indicator when it has a value and is not loading", async () => {
        const fixture = await createSignalFormFixture();

        expect(getIndicator(fixture, "clear")).toBeTruthy();
        expect(getIndicator(fixture, "loading")).toBeNull();
        expect(getIndicator(fixture, "toggle")).toBeNull();
    });

    it("renders the loading indicator instead of the clear indicator while loading", async () => {
        const fixture = await createSignalFormFixture();
        fixture.componentInstance.loading.set(true);
        await waitForStable(fixture);

        expect(getIndicator(fixture, "clear")).toBeNull();
        expect(getIndicator(fixture, "loading")).toBeTruthy();
        expect(getIndicator(fixture, "toggle")).toBeNull();
    });

    it("reflects required invalid state from signal forms", async () => {
        const fixture = await createSignalFormFixture();
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

    it("leaves the input's name to its placeholder when no label is given", async () => {
        await TestBed.configureTestingModule({
            imports: [AutoCompleteComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(AutoCompleteComponent);
        fixture.componentRef.setInput("placeholder", "Search foods");
        fixture.detectChanges();

        // An aria-label copied from the placeholder would hide a <label for> pointed at inputId.
        expect(getInput(fixture).hasAttribute("aria-label")).toBe(false);
        expect(getInput(fixture).placeholder).toBe("Search foods");
    });

    it("exposes a single combobox role and tab stop on the input, not the host", async () => {
        const fixture = await createSignalFormFixture();

        expect(getHost(fixture).getAttribute("role")).toBeNull();
        expect(getHost(fixture).getAttribute("tabindex")).toBe("-1");
        expect(getInput(fixture).getAttribute("role")).toBe("combobox");
        expect(getHost(fixture).querySelectorAll("[role='combobox']").length).toBe(1);
    });

    describe("keyboard", () => {
        it("ignores Enter while an IME is composing", async () => {
            const fixture = await createSignalFormFixture();

            await typeText(fixture, "car");
            const event = pressKey(fixture, "Enter", { isComposing: true });
            await waitForStable(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.form.value().value()).toBe("Banana");
            expect(getInput(fixture).getAttribute("aria-expanded")).toBe("true");
        });

        it("ignores the Enter Safari sends to confirm a conversion", async () => {
            const fixture = await createSignalFormFixture();

            await typeText(fixture, "car");
            pressKey(fixture, "Enter", { keyCode: 229 });
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe("Banana");
        });

        it("lets Escape through when the popup is closed and the field is empty", async () => {
            const fixture = await createSignalFormFixture();
            getInput(fixture).value = "";
            getInput(fixture).dispatchEvent(new Event("input", { bubbles: true }));
            await waitForStable(fixture);
            await new Promise(resolve => setTimeout(resolve, 0));
            await waitForStable(fixture);
            const escapes = countDocumentEscapes();

            pressKey(fixture, "Escape");

            expect(escapes.stop()).toBe(1);
        });

        it("keeps an Escape that clears the text from closing a surrounding dialog", async () => {
            const fixture = await createSignalFormFixture();
            const escapes = countDocumentEscapes();

            pressKey(fixture, "Escape");
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("");
            expect(escapes.stop()).toBe(0);
        });
    });

    describe("leaving the field", () => {
        it("clears the value when the text was deleted with the popup closed", async () => {
            const fixture = await createSignalFormFixture();

            await typeText(fixture, "");
            await leaveField(fixture);

            expect(fixture.componentInstance.form.value().value()).toBeNull();
            expect(getIndicator(fixture, "clear")).toBeNull();
        });
    });

    describe("clear button state", () => {
        it("is hidden on a read-only auto-complete", async () => {
            const fixture = await createSignalFormFixture();
            fixture.componentInstance.readonlyState.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });

        it("is hidden on a disabled auto-complete", async () => {
            const fixture = await createSignalFormFixture();
            fixture.componentInstance.disabled.set(true);
            await waitForStable(fixture);

            expect(getIndicator(fixture, "clear")).toBeNull();
        });
    });

    describe("API", () => {
        it("passes focus options on to the input", async () => {
            await TestBed.configureTestingModule({
                imports: [AutoCompleteComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(AutoCompleteComponent);
            fixture.detectChanges();
            const focusSpy = vi.spyOn(getInput(fixture), "focus");

            fixture.componentInstance.focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        });
    });

    describe("forms and accessibility", () => {
        it("doesn't mark the field touched while focus moves to its clear button", async () => {
            const fixture = await createSignalFormFixture();

            await leaveField(fixture, getClearButton(fixture));

            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("doesn't mark the field touched when typing changes the value", async () => {
            const fixture = await createSignalFormFixture();

            await typeText(fixture, "");

            expect(fixture.componentInstance.form.value().touched()).toBe(false);
        });

        it("applies disabled to the input in the same change detection pass", async () => {
            await TestBed.configureTestingModule({
                imports: [AutoCompleteComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(AutoCompleteComponent);
            fixture.detectChanges();

            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getInput(fixture).disabled).toBe(true);
        });

        it("shows the picked option's text even when that option was already the value", async () => {
            const fixture = await createSignalFormFixture();

            await typeText(fixture, "Ban");
            getOption("Banana").click();
            await waitForStable(fixture);

            expect(fixture.componentInstance.form.value().value()).toBe("Banana");
            expect(getInput(fixture).value).toBe("Banana");
        });

        it("accepts bare boolean attributes and moves the state to the input", async () => {
            await TestBed.configureTestingModule({
                imports: [AttributeAutoCompleteHostComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(AttributeAutoCompleteHostComponent);
            await waitForStable(fixture);
            const input = getInput(fixture);

            expect(input.disabled).toBe(true);
            expect(input.readOnly).toBe(true);
            expect(input.required).toBe(true);
            expect(getHost(fixture).getAttribute("data-disabled")).toBe("true");
        });

        it("labels the input through inputId and keeps the host free of ARIA", async () => {
            await TestBed.configureTestingModule({
                imports: [AttributeAutoCompleteHostComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(AttributeAutoCompleteHostComponent);
            await waitForStable(fixture);
            const input = getInput(fixture);
            const host = getHost(fixture);

            expect(input.id).toBe("food-input");
            expect(input.labels?.[0]?.textContent).toBe("Food");
            expect(input.getAttribute("aria-describedby")).toBe("food-help");
            expect(Array.from(host.attributes).filter(a => a.name.startsWith("aria-"))).toEqual([]);
        });

        it("renders no live region inside the field", async () => {
            const fixture = await createSignalFormFixture();

            expect(getHost(fixture).querySelector("[aria-live]")).toBeNull();
        });

        it("has no AXE violations when labelled, required and read-only", async () => {
            await TestBed.configureTestingModule({
                imports: [AttributeAutoCompleteHostComponent]
            }).compileComponents();
            const fixture = TestBed.createComponent(AttributeAutoCompleteHostComponent);
            await waitForStable(fixture);

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });

            expect(results.violations).toEqual([]);
        });
    });

    describe("i18n", () => {
        it("renders default English clear label on indicator icon", async () => {
            const fixture = await createSignalFormFixture();
            const clearBtn = getClearButton(fixture);
            expect(clearBtn.getAttribute("aria-label")).toBe("Clear");
        });

        it("updates clear label dynamically when locale changes", async () => {
            const fixture = await createSignalFormFixture();
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    autoComplete: {
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

async function createSignalFormFixture(): Promise<ComponentFixture<SignalFormAutoCompleteHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormAutoCompleteHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormAutoCompleteHostComponent);
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
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

async function leaveField(fixture: ComponentFixture<unknown>, relatedTarget: EventTarget | null = null): Promise<void> {
    getInput(fixture).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
    await waitForStable(fixture);
}

function pressKey(fixture: ComponentFixture<unknown>, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    getInput(fixture).dispatchEvent(event);
    return event;
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

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-auto-complete") as HTMLElement;
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

interface AutoCompleteFormModel {
    value: string | null;
}
