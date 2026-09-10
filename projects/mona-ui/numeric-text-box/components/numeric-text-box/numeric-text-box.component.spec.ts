import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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

            expect(
                element.classList.contains(
                    "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
                )
            ).toBe(true);
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

    describe("i18n and accessibility", () => {
        let fixture: ComponentFixture<ValueBindingNumericTextBoxHostComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingNumericTextBoxHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            await waitForStable(fixture);
        });

        it("renders default English aria-labels for spinner buttons", () => {
            const buttons = fixture.debugElement.queryAll(By.css("button"));
            expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("Increase value");
            expect(buttons[1].nativeElement.getAttribute("aria-label")).toBe("Decrease value");
        });

        it("updates spinner button aria-labels dynamically when locale changes", async () => {
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    numericTextBox: {
                        decrease: "Değeri azalt",
                        increase: "Değeri artır"
                    }
                }
            });
            await waitForStable(fixture);

            const buttons = fixture.debugElement.queryAll(By.css("button"));
            expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("Değeri artır");
            expect(buttons[1].nativeElement.getAttribute("aria-label")).toBe("Değeri azalt");
        });

        it("formats zero decimals strictly when blurred but preserves precision when editing", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.value.set(1.23456);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            expect(input.value).toBe("1");

            focusInput(input);
            await waitForStable(hostFixture);
            expect(input.value).toBe("1.23456");

            blurInput(input);
            await waitForStable(hostFixture);
            expect(input.value).toBe("1");
            expect(hostFixture.componentInstance.value()).toBe(1.23456);
        });

        it("formats explicit decimals when decimals is set to 2", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(2);
            hostFixture.componentInstance.value.set(1.23456);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            expect(input.value).toBe("1.23");
        });

        it("parses localized Arabic-Indic digits in ar-SA", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.maxValue.set(2000);
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "rtl",
                id: "ar-SA",
                messages: {}
            });
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            focusInput(input);
            await waitForStable(hostFixture);

            updateInputValue(hostFixture, "١٢٣٤٫٥");
            blurInput(input);
            await waitForStable(hostFixture);

            expect(hostFixture.componentInstance.value()).toBe(1234.5);
        });

        it("parses localized Persian digits and minus in fa-IR", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.minValue.set(-100);
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "rtl",
                id: "fa-IR",
                messages: {}
            });
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            focusInput(input);
            await waitForStable(hostFixture);

            updateInputValue(hostFixture, "−۱۲٫۵");
            blurInput(input);
            await waitForStable(hostFixture);

            expect(hostFixture.componentInstance.value()).toBe(-12.5);
        });

        it("prevents typing decimal separator when decimals is 0", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: "."
            });
            input.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it("allows typing localized digits in beforeinput for Arabic locale", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "rtl",
                id: "ar-SA",
                messages: {}
            });
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            input.value = "";
            input.selectionStart = 0;
            input.selectionEnd = 0;

            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: "١"
            });
            input.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        });

        it("increments fractional steps accurately when decimals is default 0", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.step.set(0.5);
            hostFixture.componentInstance.value.set(1);
            await waitForStable(hostFixture);

            const numericComponent = hostFixture.debugElement.query(
                By.directive(NumericTextBoxComponent)
            ).componentInstance as NumericTextBoxComponent;

            numericComponent.increase();
            await waitForStable(hostFixture);

            expect(hostFixture.componentInstance.value()).toBe(1.5);
        });

        it("clamps to fractional minValue accurately without mutating through decimals=0", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.minValue.set(0.5);
            hostFixture.componentInstance.value.set(-1);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            blurInput(input);
            await waitForStable(hostFixture);

            expect(hostFixture.componentInstance.value()).toBe(0.5);
        });

        it("clamps to fractional maxValue accurately without mutating through decimals=0", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.maxValue.set(5.5);
            hostFixture.componentInstance.value.set(10);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            blurInput(input);
            await waitForStable(hostFixture);

            expect(hostFixture.componentInstance.value()).toBe(5.5);
        });

        it("preserves programmatic precision on focus and blur when decimals=0", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.value.set(1.75);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            expect(input.value).toBe("2");

            focusInput(input);
            await waitForStable(hostFixture);
            expect(input.value).toBe("1.75");

            blurInput(input);
            await waitForStable(hostFixture);
            expect(input.value).toBe("2");
            expect(hostFixture.componentInstance.value()).toBe(1.75);
        });

        it("normalizes negative decimals to 0 without throwing regex SyntaxError", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(-1);
            hostFixture.componentInstance.value.set(5);
            await waitForStable(hostFixture);

            const input = getInput(hostFixture);
            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: "3"
            });
            expect(() => input.dispatchEvent(event)).not.toThrow();
        });

        it("supports fractional step across de-DE, ar-SA, and fa-IR locales", async () => {
            const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
            hostFixture.componentInstance.decimals.set(0);
            hostFixture.componentInstance.step.set(0.5);
            const numericComponent = hostFixture.debugElement.query(
                By.directive(NumericTextBoxComponent)
            ).componentInstance as NumericTextBoxComponent;
            const i18nService = TestBed.inject(MonaI18nService);

            // de-DE
            i18nService.use({ id: "de-DE", direction: "ltr", messages: {} });
            hostFixture.componentInstance.value.set(1);
            await waitForStable(hostFixture);
            numericComponent.increase();
            await waitForStable(hostFixture);
            expect(hostFixture.componentInstance.value()).toBe(1.5);

            // ar-SA
            i18nService.use({ id: "ar-SA", direction: "rtl", messages: {} });
            hostFixture.componentInstance.value.set(1);
            await waitForStable(hostFixture);
            numericComponent.increase();
            await waitForStable(hostFixture);
            expect(hostFixture.componentInstance.value()).toBe(1.5);

            // fa-IR
            i18nService.use({ id: "fa-IR", direction: "rtl", messages: {} });
            hostFixture.componentInstance.value.set(1);
            await waitForStable(hostFixture);
            numericComponent.increase();
            await waitForStable(hostFixture);
            expect(hostFixture.componentInstance.value()).toBe(1.5);
        });

        describe("direct input and edit validation without beforeinput", () => {
            it("rejects malformed repeated comma direct input and preserves prior model value", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12,3,4");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "12,34,567");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "1,2,3");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);
            });

            it("rejects malformed repeated dot direct input and preserves prior model value", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12.3.4");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                const i18nService = TestBed.inject(MonaI18nService);
                i18nService.use({ id: "fr-FR", direction: "ltr", messages: {} });
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12.34.567");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "1.2.3");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);
            });

            it("rejects direct input with whitespace and preserves prior model value", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, " 12");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "12 ");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "1 2");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);
            });

            it("accepts valid en-US alternate comma decimal separator on direct input", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12,5");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12.5);

                updateInputValue(hostFixture, "1,5");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(1.5);
            });

            it("accepts valid de-DE alternate dot decimal separator on direct input", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                const i18nService = TestBed.inject(MonaI18nService);
                i18nService.use({ id: "de-DE", direction: "ltr", messages: {} });

                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12.5");
                await waitForStable(hostFixture);

                expect(hostFixture.componentInstance.value()).toBe(12.5);
            });

            it("accepts valid fr-FR alternate dot decimal separator on direct input", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                const i18nService = TestBed.inject(MonaI18nService);
                i18nService.use({ id: "fr-FR", direction: "ltr", messages: {} });

                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "1.5");
                await waitForStable(hostFixture);

                expect(hostFixture.componentInstance.value()).toBe(1.5);
            });

            it("preserves prior semantic model on transitional states like trailing separator or lone sign", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "12.");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "12,");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);

                updateInputValue(hostFixture, "-");
                await waitForStable(hostFixture);
                expect(hostFixture.componentInstance.value()).toBe(12);
            });

            it("clears semantic model to null when direct input is empty string", async () => {
                const hostFixture = TestBed.createComponent(ValueBindingNumericTextBoxHostComponent);
                hostFixture.componentInstance.decimals.set(2);
                hostFixture.componentInstance.value.set(12);
                await waitForStable(hostFixture);

                updateInputValue(hostFixture, "");
                await waitForStable(hostFixture);

                expect(hostFixture.componentInstance.value()).toBeNull();
            });
        });
    });
});

interface FormModel {
    amount: number | null;
}
