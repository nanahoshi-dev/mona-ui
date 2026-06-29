import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";

import { ColorGradientComponent } from "./color-gradient.component";

@Component({
    template: `<mona-color-gradient [(value)]="value" [disabled]="disabled()"></mona-color-gradient>`,
    imports: [ColorGradientComponent]
})
class ValueBindingColorGradientHostComponent {
    public readonly disabled = signal(false);
    public readonly value = signal<string | null | undefined>("#336699");
}

@Component({
    template: `<mona-color-gradient [formField]="form.color" [showButtons]="false"></mona-color-gradient>`,
    imports: [ColorGradientComponent, FormField]
})
class SignalFormColorGradientHostComponent {
    readonly #formModel = signal<ColorGradientFormModel>({ color: "#112233" });
    public readonly form = form(this.#formModel);
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getHexInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.debugElement.query(By.css("mona-text-box input")).nativeElement as HTMLInputElement;
}

function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
}

function dispatchHsvKey(handle: HTMLDivElement, key: string, options: KeyboardEventInit = {}): void {
    handle.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

function getHsvHandle(fixture: ComponentFixture<unknown>): HTMLDivElement {
    return fixture.nativeElement.querySelector("[role='slider']") as HTMLDivElement;
}

function getHsvHandleLeft(handle: HTMLDivElement): number {
    return Number.parseFloat(handle.style.left || "0");
}

function getHsvHandleTop(handle: HTMLDivElement): number {
    return Number.parseFloat(handle.style.top || "0");
}

function getHsvSliderValue(handle: HTMLDivElement): HsvSliderValue {
    const valueText = handle.getAttribute("aria-valuetext") ?? "";
    const match = /Saturation (\d+)%, Value (\d+)%/.exec(valueText);
    if (!match) {
        throw new Error(`Unexpected HSV slider value text: ${valueText}`);
    }
    return {
        saturation: Number.parseInt(match[1], 10),
        value: Number.parseInt(match[2], 10)
    };
}

describe("ColorGradientComponent", () => {
    let component: ColorGradientComponent;
    let fixture: ComponentFixture<ColorGradientComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent]
        });
        fixture = TestBed.createComponent(ColorGradientComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("does not throw when the hsv rectangle click updates after render", async () => {
        await waitForStable(fixture);

        const rectangle = fixture.nativeElement.querySelector("div") as HTMLDivElement;
        const handle = fixture.nativeElement.querySelector("[role='slider']") as HTMLDivElement;

        Object.defineProperties(rectangle, {
            offsetHeight: { configurable: true, value: 100 },
            offsetWidth: { configurable: true, value: 100 }
        });
        Object.defineProperties(handle, {
            offsetHeight: { configurable: true, value: 10 },
            offsetWidth: { configurable: true, value: 10 }
        });
        rectangle.getBoundingClientRect = () => createDomRect({ height: 100, width: 100 });
        handle.getBoundingClientRect = () => createDomRect({ height: 10, width: 10 });

        rectangle.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 50 }));

        await waitForStable(fixture);
        expect(component).toBeTruthy();
    });
});

describe("ColorGradientComponent value binding", () => {
    let fixture: ComponentFixture<ValueBindingColorGradientHostComponent>;
    let component: ValueBindingColorGradientHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ValueBindingColorGradientHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ValueBindingColorGradientHostComponent);
        component = fixture.componentInstance;
        await waitForStable(fixture);
    });

    it("hydrates the color inputs from an external value", () => {
        expect(getHexInput(fixture).value).toBe("#336699");
    });

    it("reflects later value changes in the color inputs", async () => {
        component.value.set("#663399");

        await waitForStable(fixture);

        expect(getHexInput(fixture).value).toBe("#663399");
    });
});

describe("ColorGradientComponent signal forms", () => {
    let fixture: ComponentFixture<SignalFormColorGradientHostComponent>;
    let component: SignalFormColorGradientHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SignalFormColorGradientHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SignalFormColorGradientHostComponent);
        component = fixture.componentInstance;
        await waitForStable(fixture);
    });

    it("reflects signal form value changes", async () => {
        component.form.color().value.set("#445566");

        await waitForStable(fixture);

        expect(getHexInput(fixture).value).toBe("#445566");
    });

    it("updates the signal form value from hex input changes", async () => {
        setInputValue(getHexInput(fixture), "#abcdef");

        await waitForStable(fixture);

        expect(component.form.color().value()).toBe("#abcdef");
    });
});

describe("ColorGradientComponent hexFocused regression", () => {
    let fixture: ComponentFixture<ValueBindingColorGradientHostComponent>;
    let component: ValueBindingColorGradientHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ValueBindingColorGradientHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ValueBindingColorGradientHostComponent);
        component = fixture.componentInstance;
        await waitForStable(fixture);
    });

    it("updates the hex input after focus+blur when external value changes", async () => {
        const hexInput = getHexInput(fixture);
        hexInput.dispatchEvent(new FocusEvent("focus"));
        fixture.detectChanges();
        hexInput.dispatchEvent(new FocusEvent("blur"));
        fixture.detectChanges();

        component.value.set("#aabbcc");
        await waitForStable(fixture);

        expect(getHexInput(fixture).value).toBe("#aabbcc");
    });
});

describe("ColorGradientComponent disabled state", () => {
    let fixture: ComponentFixture<ValueBindingColorGradientHostComponent>;
    let component: ValueBindingColorGradientHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ValueBindingColorGradientHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ValueBindingColorGradientHostComponent);
        component = fixture.componentInstance;
        await waitForStable(fixture);
    });

    it("sets aria-disabled and tabindex=-1 on HSV handle when disabled", async () => {
        component.disabled.set(true);
        await waitForStable(fixture);

        const handle = fixture.nativeElement.querySelector("[role='slider']") as HTMLDivElement;
        expect(handle.getAttribute("aria-disabled")).toBe("true");
        expect(handle.getAttribute("tabindex")).toBe("-1");
    });

    it("restores tabindex=0 and removes aria-disabled when re-enabled", async () => {
        component.disabled.set(true);
        await waitForStable(fixture);
        component.disabled.set(false);
        await waitForStable(fixture);

        const handle = fixture.nativeElement.querySelector("[role='slider']") as HTMLDivElement;
        expect(handle.getAttribute("aria-disabled")).toBeNull();
        expect(handle.getAttribute("tabindex")).toBe("0");
    });
});

describe("ColorGradientComponent previous-color swatch keyboard", () => {
    let fixture: ComponentFixture<ValueBindingColorGradientHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ValueBindingColorGradientHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ValueBindingColorGradientHostComponent);
        await waitForStable(fixture);
    });

    it("resets to the previous color via Enter key on the swatch", async () => {
        // Change the color away from the initial value
        setInputValue(getHexInput(fixture), "#aabbcc");
        await waitForStable(fixture);

        // Press Enter on the previous-color swatch to reset
        const swatch = fixture.nativeElement.querySelector("[role='button']") as HTMLDivElement;
        swatch.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await waitForStable(fixture);

        expect(getHexInput(fixture).value).toBe("#336699");
    });

    it("resets to the previous color via Space key on the swatch", async () => {
        setInputValue(getHexInput(fixture), "#aabbcc");
        await waitForStable(fixture);

        const swatch = fixture.nativeElement.querySelector("[role='button']") as HTMLDivElement;
        swatch.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        await waitForStable(fixture);

        expect(getHexInput(fixture).value).toBe("#336699");
    });

    it("has tabindex=0 on the previous-color swatch", () => {
        const swatches = fixture.nativeElement.querySelectorAll("[role='button']") as NodeListOf<HTMLDivElement>;
        expect(swatches[0].getAttribute("tabindex")).toBe("0");
    });
});

describe("ColorGradientComponent HSV keyboard navigation", () => {
    let fixture: ComponentFixture<ColorGradientComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ColorGradientComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ColorGradientComponent);
        await waitForStable(fixture);

        const rectangle = fixture.nativeElement.querySelector("div") as HTMLDivElement;
        const handle = fixture.nativeElement.querySelector("[role='slider']") as HTMLDivElement;
        Object.defineProperties(rectangle, {
            offsetHeight: { configurable: true, value: 100 },
            offsetWidth: { configurable: true, value: 100 }
        });
        Object.defineProperties(handle, {
            offsetHeight: { configurable: true, value: 10 },
            offsetWidth: { configurable: true, value: 10 }
        });
        rectangle.getBoundingClientRect = () => createDomRect({ height: 100, width: 100 });
        handle.getBoundingClientRect = () => createDomRect({ height: 10, width: 10 });
        fixture.componentRef.setInput("value", "#9C4E4E");
        await waitForStable(fixture);
    });

    it("moves the handle right on ArrowRight", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);
        const initialLeft = getHsvHandleLeft(handle);

        dispatchHsvKey(handle, "ArrowRight");
        await waitForStable(fixture);

        const next = getHsvSliderValue(handle);
        expect(next.saturation).toBe(initial.saturation + 1);
        expect(next.value).toBe(initial.value);
        expect(getHsvHandleLeft(handle)).toBeGreaterThan(initialLeft);
    });

    it("moves the handle left on ArrowLeft when not at minimum", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);
        const initialLeft = getHsvHandleLeft(handle);

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);

        const next = getHsvSliderValue(handle);
        expect(next.saturation).toBe(initial.saturation - 1);
        expect(next.value).toBe(initial.value);
        expect(getHsvHandleLeft(handle)).toBeLessThan(initialLeft);
    });

    it("decreases saturation monotonically on repeated ArrowLeft", async () => {
        const handle = getHsvHandle(fixture);
        const saturations: number[] = [];

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);

        expect(saturations).toEqual([49, 48, 47]);
    });

    it("does not bounce when repeated ArrowLeft emits values immediately", async () => {
        fixture.componentRef.setInput("showButtons", false);
        await waitForStable(fixture);

        const handle = getHsvHandle(fixture);
        const saturations: number[] = [];
        const hexValues: string[] = [];

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);
        hexValues.push(getHexInput(fixture).value);

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);
        hexValues.push(getHexInput(fixture).value);

        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        saturations.push(getHsvSliderValue(handle).saturation);
        hexValues.push(getHexInput(fixture).value);

        expect(saturations).toEqual([49, 48, 47]);
        expect(hexValues).not.toEqual(["#9c4f4f", "#9c4e4e", "#9c4f4f"]);
    });

    it("moves the handle up without changing saturation", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);
        const initialLeft = getHsvHandleLeft(handle);
        const initialTop = getHsvHandleTop(handle);

        dispatchHsvKey(handle, "ArrowUp");
        await waitForStable(fixture);

        const next = getHsvSliderValue(handle);
        expect(next.saturation).toBe(initial.saturation);
        expect(next.value).toBe(initial.value + 1);
        expect(getHsvHandleLeft(handle)).toBe(initialLeft);
        expect(getHsvHandleTop(handle)).toBeLessThan(initialTop);
    });

    it("moves the handle down without changing saturation", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);
        const initialLeft = getHsvHandleLeft(handle);
        const initialTop = getHsvHandleTop(handle);

        dispatchHsvKey(handle, "ArrowDown");
        await waitForStable(fixture);

        const next = getHsvSliderValue(handle);
        expect(next.saturation).toBe(initial.saturation);
        expect(next.value).toBe(initial.value - 1);
        expect(getHsvHandleLeft(handle)).toBe(initialLeft);
        expect(getHsvHandleTop(handle)).toBeGreaterThan(initialTop);
    });

    it("uses a larger keyboard step when Shift is held", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);

        dispatchHsvKey(handle, "ArrowLeft", { shiftKey: true });
        await waitForStable(fixture);

        const next = getHsvSliderValue(handle);
        expect(next.saturation).toBe(initial.saturation - 10);
        expect(next.value).toBe(initial.value);
    });

    it("uses PageUp and PageDown for large value steps", async () => {
        const handle = getHsvHandle(fixture);
        const initial = getHsvSliderValue(handle);

        dispatchHsvKey(handle, "PageUp");
        await waitForStable(fixture);
        expect(getHsvSliderValue(handle).value).toBe(initial.value + 25);

        dispatchHsvKey(handle, "PageDown");
        await waitForStable(fixture);
        expect(getHsvSliderValue(handle).value).toBe(initial.value);
    });

    it("moves to the top-left and bottom-right corners on Home and End", async () => {
        const handle = getHsvHandle(fixture);

        dispatchHsvKey(handle, "Home");
        await waitForStable(fixture);

        expect(getHsvSliderValue(handle)).toEqual({ saturation: 0, value: 100 });
        expect(getHsvHandleLeft(handle)).toBe(-5);
        expect(getHsvHandleTop(handle)).toBe(-5);

        dispatchHsvKey(handle, "End");
        await waitForStable(fixture);

        expect(getHsvSliderValue(handle)).toEqual({ saturation: 100, value: 0 });
        expect(getHsvHandleLeft(handle)).toBe(95);
        expect(getHsvHandleTop(handle)).toBe(95);
    });

    it("clamps keyboard movement at HSV boundaries", async () => {
        const handle = getHsvHandle(fixture);

        dispatchHsvKey(handle, "Home");
        await waitForStable(fixture);
        dispatchHsvKey(handle, "ArrowLeft");
        await waitForStable(fixture);
        dispatchHsvKey(handle, "ArrowUp");
        await waitForStable(fixture);

        expect(getHsvSliderValue(handle)).toEqual({ saturation: 0, value: 100 });

        dispatchHsvKey(handle, "End");
        await waitForStable(fixture);
        dispatchHsvKey(handle, "ArrowRight");
        await waitForStable(fixture);
        dispatchHsvKey(handle, "ArrowDown");
        await waitForStable(fixture);

        expect(getHsvSliderValue(handle)).toEqual({ saturation: 100, value: 0 });
    });
});

describe("ColorGradientComponent showColorInputs", () => {
    let fixture: ComponentFixture<ColorGradientComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ColorGradientComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ColorGradientComponent);
        await waitForStable(fixture);
    });

    it("hides channel inputs when showColorInputs is false", async () => {
        fixture.componentRef.setInput("showColorInputs", false);
        await waitForStable(fixture);

        const numericInputs = fixture.nativeElement.querySelectorAll("mona-numeric-text-box");
        expect(numericInputs.length).toBe(0);
    });

    it("shows channel inputs by default", async () => {
        const numericInputs = fixture.nativeElement.querySelectorAll("mona-numeric-text-box");
        expect(numericInputs.length).toBeGreaterThan(0);
    });
});

describe("ColorGradientComponent format output", () => {
    let fixture: ComponentFixture<ColorGradientComponent>;
    let component: ColorGradientComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ColorGradientComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ColorGradientComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("showButtons", false);
        fixture.componentRef.setInput("format", "rgb");
        fixture.componentRef.setInput("value", "#ff0000");
        await waitForStable(fixture);
    });

    it("emits rgba string when format is rgb", async () => {
        setInputValue(getHexInput(fixture), "#00ff00");
        await waitForStable(fixture);

        const emittedValue = component.value();
        expect(emittedValue).toMatch(/^rgba\(/);
    });
});

function createDomRect(rect: Pick<DOMRect, "height" | "width">): DOMRect {
    return {
        bottom: rect.height,
        height: rect.height,
        left: 0,
        right: rect.width,
        top: 0,
        width: rect.width,
        x: 0,
        y: 0,
        toJSON: () => ({})
    };
}

interface ColorGradientFormModel {
    color: string | null;
}

interface HsvSliderValue {
    readonly saturation: number;
    readonly value: number;
}
