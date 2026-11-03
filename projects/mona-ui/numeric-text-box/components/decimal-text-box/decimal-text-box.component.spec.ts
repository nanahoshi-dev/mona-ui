import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecimalTextBoxComponent } from "./decimal-text-box.component";

@Component({
    template: `
        <mona-decimal-text-box
            [(value)]="value"
            [decimals]="decimals()"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()">
        </mona-decimal-text-box>
    `,
    imports: [DecimalTextBoxComponent]
})
class DecimalHostComponent {
    public readonly decimals = signal(2);
    public readonly maxValue = signal<string | number | null>(null);
    public readonly minValue = signal<string | number | null>(null);
    public readonly step = signal<string | number>("1");
    public readonly value = signal<string | null>(null);
}

@Component({
    template: `<mona-decimal-text-box [decimals]="2" [formField]="form.amount"></mona-decimal-text-box>`,
    imports: [DecimalTextBoxComponent, FormField]
})
class DecimalFormHostComponent {
    readonly #model = signal<{ amount: string | null }>({ amount: "12.5" });
    public readonly form = form(this.#model);
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.debugElement.query(By.css("input")).nativeElement as HTMLInputElement;
}

function getComponent(fixture: ComponentFixture<unknown>): DecimalTextBoxComponent {
    return fixture.debugElement.query(By.directive(DecimalTextBoxComponent)).componentInstance;
}

function typeText(fixture: ComponentFixture<unknown>, text: string): void {
    const input = getInput(fixture);
    input.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
}

function beforeInputAtEnd(input: HTMLInputElement, text: string, data: string, inputType = "insertText"): InputEvent {
    input.value = text;
    input.selectionStart = text.length;
    input.selectionEnd = text.length;
    const event = new InputEvent("beforeinput", { bubbles: true, cancelable: true, data, inputType });
    input.dispatchEvent(event);
    return event;
}

describe("DecimalTextBoxComponent", () => {
    let fixture: ComponentFixture<DecimalHostComponent>;
    let host: DecimalHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [DecimalHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(DecimalHostComponent);
        host = fixture.componentInstance;
        await waitForStable(fixture);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("precision", () => {
        it("keeps typed values exactly, past what a number can hold", async () => {
            typeText(fixture, "12345678901234567890.12");
            await waitForStable(fixture);

            expect(host.value()).toBe("12345678901234567890.12");
        });

        it("does not block digits a number could not hold", () => {
            const input = getInput(fixture);

            expect(beforeInputAtEnd(input, "9007199254740991", "9").defaultPrevented).toBe(false);
            expect(beforeInputAtEnd(input, "1234567890123.45", "6").defaultPrevented).toBe(true);
            host.decimals.set(5);
            fixture.detectChanges();
            expect(beforeInputAtEnd(input, "1234567890123.45", "6").defaultPrevented).toBe(false);
        });

        it("steps with exact decimal arithmetic", async () => {
            host.value.set("0.1");
            host.step.set("0.2");
            await waitForStable(fixture);
            getComponent(fixture).increase();
            await waitForStable(fixture);
            expect(host.value()).toBe("0.3");

            host.value.set("9007199254740993");
            host.step.set(1);
            await waitForStable(fixture);
            getComponent(fixture).increase();
            await waitForStable(fixture);
            expect(host.value()).toBe("9007199254740994");

            getComponent(fixture).decrease();
            getComponent(fixture).decrease();
            await waitForStable(fixture);
            expect(host.value()).toBe("9007199254740992");
        });
    });

    describe("bounds", () => {
        it("stops a spin at minValue and maxValue", async () => {
            host.minValue.set("-0.5");
            host.maxValue.set("100.5");
            host.step.set("0.25");
            host.value.set("100.4");
            await waitForStable(fixture);

            getComponent(fixture).increase();
            await waitForStable(fixture);
            expect(host.value()).toBe("100.5");

            host.value.set("-0.4");
            await waitForStable(fixture);
            getComponent(fixture).decrease();
            await waitForStable(fixture);
            expect(host.value()).toBe("-0.5");
        });

        it("starts an empty input at zero, or at the bound zero is outside of", async () => {
            getComponent(fixture).increase();
            await waitForStable(fixture);
            expect(host.value()).toBe("0");

            host.value.set(null);
            host.minValue.set(5);
            await waitForStable(fixture);
            getComponent(fixture).increase();
            await waitForStable(fixture);
            expect(host.value()).toBe("5");
        });

        it("corrects an out-of-range value on blur", async () => {
            host.maxValue.set("99999999999999999999");
            host.value.set("100000000000000000000");
            await waitForStable(fixture);

            getInput(fixture).dispatchEvent(new FocusEvent("blur", { bubbles: true }));
            await waitForStable(fixture);

            expect(host.value()).toBe("99999999999999999999");
        });
    });

    describe("locale", () => {
        it("displays the value with the locale's separator and the configured decimals", async () => {
            host.value.set("1234.5");
            await waitForStable(fixture);
            expect(getInput(fixture).value).toBe("1234.50");

            TestBed.inject(MonaI18nService).use({ direction: "ltr", id: "de-DE", messages: {} });
            await waitForStable(fixture);
            expect(getInput(fixture).value).toBe("1234,50");
        });

        it("reads a grouped paste in the locale's format", async () => {
            TestBed.inject(MonaI18nService).use({ direction: "ltr", id: "de-DE", messages: {} });
            await waitForStable(fixture);
            const input = getInput(fixture);

            expect(beforeInputAtEnd(input, "", "1.234.567,89", "insertFromPaste").defaultPrevented).toBe(false);
            input.value = "1.234.567,89";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await waitForStable(fixture);

            expect(host.value()).toBe("1234567.89");
        });

        it("reads Arabic-Indic digits", async () => {
            TestBed.inject(MonaI18nService).use({ direction: "rtl", id: "ar-SA", messages: {} });
            await waitForStable(fixture);

            typeText(fixture, "١٢٣٫٤٥");
            await waitForStable(fixture);

            expect(host.value()).toBe("123.45");
        });
    });

    describe("inputs", () => {
        it("accepts numbers for bounds and step", async () => {
            host.minValue.set(0);
            host.maxValue.set(0.5);
            host.step.set(0.1);
            host.value.set("0.45");
            await waitForStable(fixture);

            getComponent(fixture).increase();
            await waitForStable(fixture);

            expect(host.value()).toBe("0.5");
        });

        it("warns about an invalid step and falls back to 1", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            host.value.set("2");
            host.step.set("1e3");
            await waitForStable(fixture);

            getComponent(fixture).increase();
            await waitForStable(fixture);

            expect(host.value()).toBe("3");
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('step "1e3"'));
        });

        it("warns about a value that is not a decimal string", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            host.value.set("1,5");
            await waitForStable(fixture);

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('value "1,5"'));
        });

        it("exposes the value to assistive technology", async () => {
            host.value.set("12345678901234567890.5");
            host.minValue.set("-1");
            await waitForStable(fixture);
            const input = getInput(fixture);

            expect(input.getAttribute("role")).toBe("spinbutton");
            expect(input.getAttribute("aria-valuenow")).toBe("12345678901234567890.5");
            expect(input.getAttribute("aria-valuemin")).toBe("-1");
            expect(input.getAttribute("inputmode")).toBe("decimal");
        });
    });

    it("works as a signal form control", async () => {
        const formFixture = TestBed.createComponent(DecimalFormHostComponent);
        await waitForStable(formFixture);
        expect(getInput(formFixture).value).toBe("12.50");

        typeText(formFixture, "98765432109876543210.25");
        await waitForStable(formFixture);

        expect(formFixture.componentInstance.form.amount().value()).toBe("98765432109876543210.25");
    });
});
