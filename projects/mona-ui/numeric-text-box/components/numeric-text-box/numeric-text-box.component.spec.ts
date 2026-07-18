import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { NumericTextBoxComponent } from "./numeric-text-box.component";

@Component({
    template: `
        <mona-numeric-text-box
            [decimals]="decimals()"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()"
            [formField]="form.amount">
        </mona-numeric-text-box>
    `,
    imports: [NumericTextBoxComponent, FormField]
})
class SignalFormNumericTextBoxHostComponent {
    readonly #formModel = signal<FormModel>({ amount: null });
    public readonly decimals = signal(2);
    public readonly disabled = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.amount, { when: () => this.disabled() });
    });
    public readonly maxValue = signal<number | null>(100);
    public readonly minValue = signal<number | null>(0);
    public readonly step = signal(1);
}

@Component({
    template: `
        <mona-numeric-text-box
            [(value)]="value"
            [decimals]="decimals()"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()">
        </mona-numeric-text-box>
    `,
    imports: [NumericTextBoxComponent]
})
class ValueBindingNumericTextBoxHostComponent {
    public readonly decimals = signal(2);
    public readonly maxValue = signal<number | null>(100);
    public readonly minValue = signal<number | null>(0);
    public readonly step = signal(1);
    public readonly value = signal<number | null>(12);
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.debugElement.query(By.css("input")).nativeElement as HTMLInputElement;
}

function focusInput(input: HTMLInputElement): void {
    input.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
}

function blurInput(input: HTMLInputElement): void {
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
}

function updateInputValue(fixture: ComponentFixture<unknown>, value: string): void {
    const input = getInput(fixture);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
}

function keydown(input: HTMLInputElement, key: string): void {
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

describe("NumericTextBoxComponent", () => {
    describe("value binding", () => {
        let fixture: ComponentFixture<ValueBindingNumericTextBoxHostComponent>;
        let component: ValueBindingNumericTextBoxHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingNumericTextBoxHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("shows formatted decimals while unfocused and hides zero-only decimals while editing", async () => {
            const input = getInput(fixture);
            expect(input.value).toBe("12.00");

            focusInput(input);
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("12");
            expect(getInput(fixture).getAttribute("aria-valuetext")).toBe("12");
        });

        it("should use the shared input shell with neutral spinner actions", async () => {
            await waitForStable(fixture);
            const element = fixture.debugElement.query(By.directive(NumericTextBoxComponent))
                .nativeElement as HTMLElement;
            const spinnerContainer = fixture.debugElement.query(By.css(".border-border-subtle"))
                .nativeElement as HTMLElement;
            const spinnerButtons = fixture.debugElement.queryAll(By.css("button"));

            expect(element.classList.contains("bg-input-background")).toBe(true);
            expect(element.classList.contains("border-input-border")).toBe(true);
            expect(element.classList.contains("shadow-(--shadow-control)")).toBe(true);
            expect(element.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
            expect(element.classList.contains("data-[disabled='true']:bg-disabled-background")).toBe(true);
            expect(element.classList.contains("data-[invalid='true']:focus-within:ring-error/35")).toBe(true);
            expect(spinnerContainer).toBeTruthy();
            expect((spinnerButtons[0].nativeElement as HTMLElement).getAttribute("data-look")).toBe("ghost");
        });

        it("preserves meaningful decimals while editing", async () => {
            component.value.set(12.5);
            await waitForStable(fixture);

            const input = getInput(fixture);
            expect(input.value).toBe("12.50");

            focusInput(input);
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("12.5");
        });

        it("restores fixed decimals on blur after editing", async () => {
            const input = getInput(fixture);
            focusInput(input);
            await waitForStable(fixture);

            updateInputValue(fixture, "12");
            blurInput(getInput(fixture));
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("12.00");
            expect(component.value()).toBe(12);
        });

        it("clamps the value on blur", async () => {
            const input = getInput(fixture);
            focusInput(input);
            await waitForStable(fixture);

            updateInputValue(fixture, "999");
            blurInput(getInput(fixture));
            await waitForStable(fixture);

            expect(component.value()).toBe(100);
            expect(getInput(fixture).value).toBe("100.00");
        });

        it("updates the value and aria state from keyboard and spinner interactions", async () => {
            const input = getInput(fixture);
            keydown(input, "ArrowUp");
            await waitForStable(fixture);

            expect(component.value()).toBe(13);
            expect(getInput(fixture).getAttribute("aria-valuenow")).toBe("13");

            const buttons = fixture.debugElement.queryAll(By.css("button"));
            (buttons[1].nativeElement as HTMLButtonElement).dispatchEvent(
                new PointerEvent("pointerdown", { bubbles: true })
            );
            (buttons[1].nativeElement as HTMLButtonElement).dispatchEvent(
                new PointerEvent("pointerup", { bubbles: true })
            );
            await waitForStable(fixture);

            expect(component.value()).toBe(12);
            expect(getInput(fixture).getAttribute("aria-valuenow")).toBe("12");
        });
    });

    describe("signal forms", () => {
        let fixture: ComponentFixture<SignalFormNumericTextBoxHostComponent>;
        let component: SignalFormNumericTextBoxHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SignalFormNumericTextBoxHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SignalFormNumericTextBoxHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("reflects signal form value changes", async () => {
            component.form.amount().value.set(15);
            await waitForStable(fixture);

            expect(getInput(fixture).value).toBe("15.00");
            expect(getInput(fixture).getAttribute("aria-valuenow")).toBe("15");
        });

        it("updates the signal form value from typing", async () => {
            focusInput(getInput(fixture));
            await waitForStable(fixture);

            updateInputValue(fixture, "42.5");
            await waitForStable(fixture);

            expect(component.form.amount().value()).toBe(42.5);
        });

        it("respects the disabled signal-form state", async () => {
            component.disabled.set(true);
            component.form.amount().value.set(15);
            await waitForStable(fixture);

            const input = getInput(fixture);
            expect(input.disabled).toBe(true);

            keydown(input, "ArrowUp");
            await waitForStable(fixture);

            expect(component.form.amount().value()).toBe(15);
        });
    });
});

interface FormModel {
    amount: number | null;
}
