import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DecimalTextBoxComponent } from "../decimal-text-box/decimal-text-box.component";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";
import { NumericTextBoxComponent } from "./numeric-text-box.component";

interface AmountModel {
    amount: number | null;
}

@Component({
    template: `
        <button id="before" type="button">Before</button>
        <label for="amount-input">Amount</label>
        <mona-numeric-text-box
            inputId="amount-input"
            aria-describedby="amount-hint"
            [decimals]="2"
            [minValue]="0"
            [maxValue]="100"
            [formField]="form.amount">
            <ng-template monaNumericTextBoxPrefixTemplate>
                <button id="prefix-button" type="button">Unit</button>
            </ng-template>
        </mona-numeric-text-box>
        <span id="amount-hint">Between 0 and 100</span>
        <button id="after" type="button">After</button>
    `,
    imports: [NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective, FormField]
})
class FormHostComponent {
    readonly #model = signal<AmountModel>({ amount: 5 });
    public readonly form = form(this.#model);
}

@Component({
    template: `
        <mona-numeric-text-box
            aria-label="Quantity"
            [decimals]="decimals()"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [nullable]="nullable()"
            [readonly]="readonly()"
            [step]="step()"
            [(value)]="value"></mona-numeric-text-box>
    `,
    imports: [NumericTextBoxComponent]
})
class ValueHostComponent {
    public readonly decimals = signal(0);
    public readonly maxValue = signal<number | null>(null);
    public readonly minValue = signal<number | null>(null);
    public readonly nullable = signal(true);
    public readonly readonly = signal(false);
    public readonly step = signal(1);
    public readonly value = signal<number | null>(5);
}

@Component({
    template: `<mona-numeric-text-box aria-label="Count" disabled readonly required spinners></mona-numeric-text-box>`,
    imports: [NumericTextBoxComponent]
})
class BareAttributeHostComponent {}

@Component({
    template: `<mona-decimal-text-box aria-label="Price" [formField]="form.price"></mona-decimal-text-box>`,
    imports: [DecimalTextBoxComponent, FormField]
})
class DecimalFormHostComponent {
    readonly #model = signal<{ price: string | null }>({ price: "1.5" });
    public readonly form = form(this.#model);
}

async function create<T>(type: new () => T): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
        "mona-numeric-text-box, mona-decimal-text-box"
    ) as HTMLElement;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.debugElement.query(By.css("input")).nativeElement as HTMLInputElement;
}

function getNumericTextBox(fixture: ComponentFixture<unknown>): NumericTextBoxComponent {
    return fixture.debugElement.query(By.directive(NumericTextBoxComponent)).componentInstance as NumericTextBoxComponent;
}

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

/** Moves focus out of the input to `next` (or nowhere), as the browser does: blur, then a bubbling focusout. */
function leave(input: HTMLInputElement, next: HTMLElement | null): void {
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: next }));
    if (next) {
        next.focus();
    } else {
        input.blur();
    }
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function type(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const input = getInput(fixture);
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await stable(fixture);
}

function wheel(target: HTMLElement, init: WheelEventInit): WheelEvent {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}

describe("NumericTextBoxComponent interaction", () => {
    afterEach(() => {
        document.body.querySelectorAll("[ng-version], div[id^='root']").forEach(node => node.remove());
    });

    describe("typing", () => {
        it("takes typed text that matches the last typed text after a spin", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            await type(fixture, "5");
            keydown(input, "ArrowUp");
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(6);

            await type(fixture, "5");

            expect(fixture.componentInstance.value()).toBe(5);
            expect(input.value).toBe("5");
        });

        it("shows a value set from outside while the field is focused", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            fixture.componentInstance.value.set(42);
            await stable(fixture);

            expect(input.value).toBe("42");
        });

        it("keeps a partly typed value while the user types", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            await type(fixture, "-");

            expect(input.value).toBe("-");
            expect(fixture.componentInstance.value()).toBe(5);
        });

        it("treats a typed -0 as zero", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            await type(fixture, "-0");

            expect(Object.is(fixture.componentInstance.value(), 0)).toBe(true);
        });
    });

    describe("mouse wheel", () => {
        it("leaves an unfocused field and the page scroll alone", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);

            const event = wheel(input, { deltaY: -100 });
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBe(5);
            expect(event.defaultPrevented).toBe(false);
            expect(document.activeElement).not.toBe(input);
        });

        it("spins a focused field, and ignores horizontal scrolling and Ctrl+wheel", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            expect(wheel(input, { deltaY: -100 }).defaultPrevented).toBe(true);
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(6);

            expect(wheel(input, { deltaX: 100, deltaY: 0 }).defaultPrevented).toBe(false);
            expect(wheel(input, { ctrlKey: true, deltaY: 100 }).defaultPrevented).toBe(false);
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(6);
        });
    });

    describe("keyboard", () => {
        it("moves ten steps with PageUp and PageDown", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();

            keydown(input, "PageUp");
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(15);

            keydown(input, "PageDown");
            keydown(input, "PageDown");
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(-5);
        });

        it("goes to the minimum and maximum with Home and End", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.minValue.set(1);
            fixture.componentInstance.maxValue.set(9);
            await stable(fixture);
            const input = getInput(fixture);
            input.focus();

            expect(keydown(input, "End").defaultPrevented).toBe(true);
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(9);

            keydown(input, "Home");
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(1);
        });

        it("leaves Home and End to the caret when there are no bounds", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();

            expect(keydown(input, "Home").defaultPrevented).toBe(false);
            expect(keydown(input, "End").defaultPrevented).toBe(false);
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(5);
        });

        it("leaves keys pressed during IME composition to the IME", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            input.focus();

            expect(keydown(input, "ArrowUp", { isComposing: true }).defaultPrevented).toBe(false);
            expect(keydown(input, "ArrowUp", { keyCode: 229 }).defaultPrevented).toBe(false);
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(5);
        });
    });

    describe("bounds", () => {
        it("brings a value below the minimum up to it when spun up", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.minValue.set(10);
            await stable(fixture);
            getInput(fixture).focus();

            keydown(getInput(fixture), "ArrowUp");
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBe(10);
        });

        it("clamps the empty value of a non-nullable field to the maximum", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.nullable.set(false);
            fixture.componentInstance.maxValue.set(-5);
            fixture.componentInstance.value.set(null);
            await stable(fixture);
            const input = getInput(fixture);
            input.focus();

            leave(input, null);
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBe(-5);
        });

        it("spins by a step written with an exponent", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.step.set(1e-7);
            fixture.componentInstance.value.set(0.1);
            await stable(fixture);
            getInput(fixture).focus();

            keydown(getInput(fixture), "ArrowUp");
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBe(0.1000001);
        });

        it("doesn't move a value past the safe integer range the wrong way", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.value.set(1e21);
            await stable(fixture);
            getInput(fixture).focus();

            keydown(getInput(fixture), "ArrowUp");
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBe(1e21);
        });
    });

    describe("forms", () => {
        it("marks the field touched only when focus leaves the component", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.amount;
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            await type(fixture, "7");
            keydown(input, "ArrowUp");
            await stable(fixture);
            expect(field().touched()).toBe(false);
            expect(field().value()).toBe(8);

            leave(input, document.getElementById("after"));
            await stable(fixture);
            expect(field().touched()).toBe(true);
        });

        it("doesn't count focus moving into a prefix template as leaving", async () => {
            const fixture = await create(FormHostComponent);
            const input = getInput(fixture);
            const blurSpy = vi.fn();
            getNumericTextBox(fixture).inputBlur.subscribe(blurSpy);
            input.focus();
            await stable(fixture);

            const prefixButton = document.getElementById("prefix-button") as HTMLButtonElement;
            leave(input, prefixButton);
            await stable(fixture);
            expect(fixture.componentInstance.form.amount().touched()).toBe(false);
            expect(blurSpy).not.toHaveBeenCalled();

            prefixButton.dispatchEvent(
                new FocusEvent("focusout", { bubbles: true, relatedTarget: document.getElementById("after") })
            );
            await stable(fixture);
            expect(fixture.componentInstance.form.amount().touched()).toBe(true);
            expect(blurSpy).toHaveBeenCalledTimes(1);
        });

        it("marks a decimal text box touched only when focus leaves it", async () => {
            const fixture = await create(DecimalFormHostComponent);
            const input = getInput(fixture);
            input.focus();
            await stable(fixture);

            await type(fixture, "3");
            expect(fixture.componentInstance.form.price().value()).toBe("3");
            expect(fixture.componentInstance.form.price().touched()).toBe(false);

            leave(input, null);
            await stable(fixture);
            expect(fixture.componentInstance.form.price().touched()).toBe(true);
        });

        it("disables the input in the same change detection pass", async () => {
            const fixture = await create(BareAttributeHostComponent);

            expect(getInput(fixture).disabled).toBe(true);
        });

        it("accepts bare boolean attributes", async () => {
            const fixture = await create(BareAttributeHostComponent);
            const input = getInput(fixture);

            expect(input.readOnly).toBe(true);
            expect(input.required).toBe(true);
        });
    });

    describe("accessibility", () => {
        it("links the input to its label and description, and keeps ARIA off the host", async () => {
            const fixture = await create(FormHostComponent);
            const input = getInput(fixture);
            const host = getHost(fixture);

            expect(input.id).toBe("amount-input");
            expect(input.labels?.[0]?.textContent).toBe("Amount");
            expect(input.getAttribute("aria-describedby")).toBe("amount-hint");
            expect(host.hasAttribute("aria-describedby")).toBe(false);

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { region: { enabled: false } }
            });
            expect(results.violations).toEqual([]);
        });

        it("names the input from aria-label without leaving it on the host", async () => {
            const fixture = await create(ValueHostComponent);

            expect(getInput(fixture).getAttribute("aria-label")).toBe("Quantity");
            expect(getHost(fixture).hasAttribute("aria-label")).toBe(false);
        });

        it("relies on the native disabled, readonly and required attributes", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);

            expect(input.hasAttribute("aria-disabled")).toBe(false);
            expect(input.hasAttribute("aria-readonly")).toBe(false);
            expect(input.hasAttribute("aria-required")).toBe(false);
        });

        it("drops aria-valuetext while the field is empty", async () => {
            const fixture = await create(ValueHostComponent);
            fixture.componentInstance.value.set(null);
            await stable(fixture);

            expect(getInput(fixture).hasAttribute("aria-valuetext")).toBe(false);
        });

        it("hides the spin buttons on a read-only field", async () => {
            const fixture = await create(ValueHostComponent);
            expect(getHost(fixture).querySelectorAll("button").length).toBe(2);

            fixture.componentInstance.readonly.set(true);
            await stable(fixture);

            expect(getHost(fixture).querySelectorAll("button").length).toBe(0);
        });

        it("spins only on the primary pointer button", async () => {
            const fixture = await create(ValueHostComponent);
            const increase = getHost(fixture).querySelector("button") as HTMLButtonElement;

            increase.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
            increase.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 2 }));
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(5);

            increase.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
            increase.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
            await stable(fixture);
            expect(fixture.componentInstance.value()).toBe(6);
        });
    });

    describe("API", () => {
        it("passes focus options on to the input", async () => {
            const fixture = await create(ValueHostComponent);
            const input = getInput(fixture);
            const focusSpy = vi.spyOn(input, "focus");

            getNumericTextBox(fixture).focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
            expect(document.activeElement).toBe(input);
        });
    });
});
