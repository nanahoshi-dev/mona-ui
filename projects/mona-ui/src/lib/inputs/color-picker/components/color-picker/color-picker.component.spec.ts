import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, readonly as fieldReadonly, required } from "@angular/forms/signals";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { afterEach, describe, expect, it } from "vitest";

import { ColorPickerValueTemplateDirective } from "../../directives/color-picker-value-template.directive";
import { ColorPickerComponent } from "./color-picker.component";

const TEST_PALETTE = ["#111111", "#222222", "#333333"] as const;

@Component({
    template: `
        <mona-color-picker
            [(value)]="value"
            [disabled]="disabled()"
            [palette]="palette"
            [readonly]="readonlyState()"
            [view]="view()">
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent]
})
class ValueBindingColorPickerHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly disabled = signal(false);
    public readonly readonlyState = signal(false);
    public readonly value = signal<string | null>("#222222");
    public readonly view = signal<"gradient" | "palette">("palette");
}

@Component({
    template: `
        <mona-color-picker
            [formField]="form.color"
            [palette]="palette"
            view="palette">
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent, FormField]
})
class SignalFormColorPickerHostComponent {
    readonly #formModel = signal<ColorPickerFormModel>({ color: "#111111" });
    protected readonly palette = TEST_PALETTE;
    public readonly readonlyState = signal(false);
    public readonly requiredState = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldReadonly(schema.color, { when: () => this.readonlyState() });
        required(schema.color, { when: () => this.requiredState() });
    });
}

@Component({
    template: `
        <mona-color-picker
            [closeOnSelect]="closeOnSelect()"
            [(value)]="value"
            [palette]="palette"
            [showClearButton]="showClearButton()"
            view="palette">
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent]
})
class ClearButtonColorPickerHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly closeOnSelect = signal(true);
    public readonly showClearButton = signal(true);
    public readonly value = signal<string | null>("#111111");
}

@Component({
    template: `
        <mona-color-picker [closeOnSelect]="closeOnSelect()" [(value)]="value" [palette]="palette" view="palette">
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent]
})
class CloseOnSelectColorPickerHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly closeOnSelect = signal(false);
    public readonly value = signal<string | null>(null);
}

@Component({
    template: `
        <mona-color-picker [(value)]="value" [palette]="palette" view="palette">
            <ng-template monaColorPickerValueTemplate let-color>
                <span class="custom-value-template">{{ color ?? "none" }}</span>
            </ng-template>
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective]
})
class CustomValueTemplateColorPickerHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly value = signal<string | null>("#111111");
}

describe("ColorPickerComponent", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("should create", async () => {
        await TestBed.configureTestingModule({
            imports: [ColorPickerComponent, BrowserAnimationsModule]
        }).compileComponents();

        const fixture = TestBed.createComponent(ColorPickerComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    it("opens the gradient popup without requiring a control value accessor", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;
        component.view.set("gradient");
        await waitForStable(fixture);

        getPicker(fixture).click();
        await waitForStable(fixture);

        expect(document.body.querySelector("mona-color-gradient")).not.toBeNull();
    });
});

describe("ColorPickerComponent value binding", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("hydrates the preview from the bound value", async () => {
        const fixture = await createValueBindingFixture();

        expect(getPreview(fixture).style.background).toBe("rgb(34, 34, 34)");
    });

    it("updates the bound value when a palette color is selected", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;

        await openPicker(fixture);
        getOverlayTile(0).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#111111");
    });

    it("does not open or change value when disabled", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;
        component.disabled.set(true);
        await waitForStable(fixture);

        getPicker(fixture).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#222222");
        expect(document.body.querySelector("mona-color-palette")).toBeNull();
        expect(getPicker(fixture).getAttribute("aria-disabled")).toBe("true");
        expect(getPicker(fixture).getAttribute("tabindex")).toBe("-1");
    });

    it("does not open or change value when readonly and keeps the host focusable", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;
        component.readonlyState.set(true);
        await waitForStable(fixture);

        getPicker(fixture).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#222222");
        expect(document.body.querySelector("mona-color-palette")).toBeNull();
        expect(getPicker(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getPicker(fixture).getAttribute("tabindex")).toBe("0");
    });
});

describe("ColorPickerComponent signal forms", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("hydrates the preview from the signal form value", async () => {
        const fixture = await createSignalFormFixture();

        expect(getPreview(fixture).style.background).toBe("rgb(17, 17, 17)");
    });

    it("updates the signal form value and touched state from palette selection", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;

        await openPicker(fixture);
        getOverlayTile(1).click();
        await waitForStable(fixture);

        expect(component.form.color().value()).toBe("#222222");
        expect(component.form.color().touched()).toBe(true);
    });

    it("reflects signal form readonly state and prevents opening", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;
        component.readonlyState.set(true);
        await waitForStable(fixture);

        getPicker(fixture).click();
        await waitForStable(fixture);

        const picker = getPicker(fixture);
        expect(component.form.color().value()).toBe("#111111");
        expect(document.body.querySelector("mona-color-palette")).toBeNull();
        expect(picker.getAttribute("aria-readonly")).toBe("true");
        expect(picker.getAttribute("data-readonly")).toBe("true");
    });

    it("reflects required invalid state on the host", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;
        component.requiredState.set(true);
        component.form.color().value.set(null);
        component.form.color().markAsTouched();
        await waitForStable(fixture);

        const picker = getPicker(fixture);
        expect(component.form.color().invalid()).toBe(true);
        expect(picker.getAttribute("aria-invalid")).toBe("true");
        expect(picker.getAttribute("aria-required")).toBe("true");
        expect(picker.getAttribute("data-invalid")).toBe("true");
        expect(picker.getAttribute("data-required")).toBe("true");
        expect(picker.className).toContain("data-[invalid='true']:border-error");
    });
});

describe("ColorPickerComponent keyboard interaction", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("opens the popup on Enter and focuses popup content", async () => {
        const fixture = await createValueBindingFixture();
        const picker = getPicker(fixture);
        picker.focus();
        dispatchKeyDown(picker, "Enter");
        await waitForPopupOpen(fixture);

        expect(document.body.querySelector("mona-color-palette")).not.toBeNull();
    });

    it("closes the popup on Escape and restores focus to the host", async () => {
        const fixture = await createValueBindingFixture();
        await openPicker(fixture);

        const picker = getPicker(fixture);
        const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
        dispatchKeyDown(dialog, "Escape");
        await waitForCondition(fixture, () => document.activeElement === picker);

        expect(document.body.querySelector("mona-color-palette")).toBeNull();
        expect(document.activeElement).toBe(picker);
    });

    it("closes the popup when Tab is pressed inside it", async () => {
        const fixture = await createValueBindingFixture();
        await openPicker(fixture);

        const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
        dispatchKeyDown(dialog, "Tab");
        await waitForStable(fixture);

        expect(document.body.querySelector("mona-color-palette")).toBeNull();
    });
});

describe("ColorPickerComponent clear button", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("resets the value and closes the popup when the clear button is clicked", async () => {
        await TestBed.configureTestingModule({
            imports: [ClearButtonColorPickerHostComponent, BrowserAnimationsModule]
        }).compileComponents();

        const fixture = TestBed.createComponent(ClearButtonColorPickerHostComponent);
        await waitForStable(fixture);
        await openPicker(fixture);

        const clearButton = document.body.querySelector('[role="dialog"] button') as HTMLElement;
        clearButton.click();
        await waitForStable(fixture);

        expect(fixture.componentInstance.value()).toBeNull();
        expect(document.body.querySelector("mona-color-palette")).toBeNull();
    });
});

describe("ColorPickerComponent closeOnSelect", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("keeps the popup open after selecting a color when closeOnSelect is false", async () => {
        await TestBed.configureTestingModule({
            imports: [CloseOnSelectColorPickerHostComponent, BrowserAnimationsModule]
        }).compileComponents();

        const fixture = TestBed.createComponent(CloseOnSelectColorPickerHostComponent);
        await waitForStable(fixture);
        await openPicker(fixture);

        getOverlayTile(0).click();
        await waitForStable(fixture);

        expect(fixture.componentInstance.value()).toBe("#111111");
        expect(document.body.querySelector("mona-color-palette")).not.toBeNull();
    });
});

describe("ColorPickerComponent custom value template", () => {
    it("renders the projected template instead of the default swatch", async () => {
        await TestBed.configureTestingModule({
            imports: [CustomValueTemplateColorPickerHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(CustomValueTemplateColorPickerHostComponent);
        await waitForStable(fixture);

        const custom = fixture.nativeElement.querySelector(".custom-value-template") as HTMLElement;
        expect(custom.textContent?.trim()).toBe("#111111");
    });
});

describe("ColorPickerComponent ARIA structure", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("links the host to the popup content via aria-controls and gives the palette popup dialog semantics", async () => {
        const fixture = await createValueBindingFixture();
        await openPicker(fixture);

        const picker = getPicker(fixture);
        const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;

        expect(dialog.id).toBeTruthy();
        expect(picker.getAttribute("aria-controls")).toBe(dialog.id);
        expect(dialog.getAttribute("aria-label")).toBeTruthy();
    });

    it("gives the gradient popup dialog semantics as well", async () => {
        const fixture = await createValueBindingFixture();
        fixture.componentInstance.view.set("gradient");
        await waitForStable(fixture);
        await openPicker(fixture);

        const picker = getPicker(fixture);
        const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;

        expect(dialog).not.toBeNull();
        expect(picker.getAttribute("aria-controls")).toBe(dialog.id);
        expect(dialog.getAttribute("aria-label")).toBeTruthy();
        expect(document.body.querySelector("mona-color-gradient")).not.toBeNull();
    });
});

describe("ColorPickerComponent gradient state propagation", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("propagates disabled to the color gradient once the popup is already open", async () => {
        const fixture = await createValueBindingFixture();
        fixture.componentInstance.view.set("gradient");
        await waitForStable(fixture);
        await openPicker(fixture);

        fixture.componentInstance.disabled.set(true);
        await waitForStable(fixture);

        const gradient = document.body.querySelector("mona-color-gradient") as HTMLElement;
        expect(gradient.getAttribute("data-disabled")).toBe("true");
    });
});

async function createValueBindingFixture(): Promise<ComponentFixture<ValueBindingColorPickerHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [ValueBindingColorPickerHostComponent, BrowserAnimationsModule]
    }).compileComponents();

    const fixture = TestBed.createComponent(ValueBindingColorPickerHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function createSignalFormFixture(): Promise<ComponentFixture<SignalFormColorPickerHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormColorPickerHostComponent, BrowserAnimationsModule]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormColorPickerHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function openPicker(fixture: ComponentFixture<unknown>): Promise<void> {
    getPicker(fixture).click();
    await waitForStable(fixture);
}

async function waitForPopupOpen(fixture: ComponentFixture<unknown>): Promise<void> {
    await waitForStable(fixture);
}

function dispatchKeyDown(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function waitForCondition(
    fixture: ComponentFixture<unknown>,
    predicate: () => boolean,
    timeoutMs = 1000
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("Timed out waiting for condition.");
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        await waitForStable(fixture);
    }
}

function getOverlayTile(index: number): HTMLElement {
    const tile = document.body.querySelectorAll("[data-color-index]")[index] as HTMLElement | undefined;
    if (!tile) {
        throw new Error(`Expected overlay color tile ${index} to be rendered.`);
    }
    return tile;
}

function getPicker(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-color-picker") as HTMLElement;
}

function getPreview(fixture: ComponentFixture<unknown>): HTMLElement {
    return getPicker(fixture).querySelector("div") as HTMLElement;
}

interface ColorPickerFormModel {
    color: string | null;
}
