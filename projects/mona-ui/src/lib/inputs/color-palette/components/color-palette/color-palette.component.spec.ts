import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, readonly as fieldReadonly, required } from "@angular/forms/signals";
import { describe, expect, it } from "vitest";

import type { PaletteType } from "@mirei/mona-ui/common";
import { flatColorScheme, materialColorScheme, websafeColorScheme } from "../../utils/colorSchemes";
import { ColorPaletteComponent } from "./color-palette.component";

const TEST_PALETTE = ["#111111", "#222222", "#333333"] as const;
const LARGE_TEST_PALETTE = Array.from({ length: 12 }, (_, i) => `#${i.toString(16).padStart(6, "0")}`);

@Component({
    template: `
        <mona-color-palette [(value)]="value" [disabled]="disabled()" [palette]="palette" [readonly]="readonlyState()">
        </mona-color-palette>
    `,
    imports: [ColorPaletteComponent]
})
class ValueBindingColorPaletteHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly disabled = signal(false);
    public readonly readonlyState = signal(false);
    public readonly value = signal<string | null>("#222222");
}

@Component({
    template: ` <mona-color-palette [formField]="form.color" [palette]="palette"> </mona-color-palette> `,
    imports: [ColorPaletteComponent, FormField]
})
class SignalFormColorPaletteHostComponent {
    readonly #formModel = signal<ColorPaletteFormModel>({ color: "#111111" });
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
        <mona-color-palette id="first" [palette]="palette"></mona-color-palette>
        <mona-color-palette id="second" [palette]="palette"></mona-color-palette>
    `,
    imports: [ColorPaletteComponent]
})
class MultiInstanceColorPaletteHostComponent {
    protected readonly palette = TEST_PALETTE;
}

@Component({
    template: `<mona-color-palette [columns]="columns()" [palette]="palette()"></mona-color-palette>`,
    imports: [ColorPaletteComponent]
})
class PaletteResolutionHostComponent {
    public readonly columns = signal(10);
    public readonly palette = signal<PaletteType | Iterable<string>>("flat");
}

@Component({
    template: `<mona-color-palette [palette]="palette" [rounded]="rounded()"></mona-color-palette>`,
    imports: [ColorPaletteComponent]
})
class RoundedVariantHostComponent {
    protected readonly palette = TEST_PALETTE;
    public readonly rounded = signal<"full" | "large" | "medium" | "none" | "small">("none");
}

describe("ColorPaletteComponent", () => {
    it("should create", async () => {
        await TestBed.configureTestingModule({
            imports: [ColorPaletteComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(ColorPaletteComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });
});

describe("ColorPaletteComponent value binding", () => {
    it("hydrates the selected tile from the bound value", async () => {
        const fixture = await createValueBindingFixture();

        expect(getTile(fixture, 1).getAttribute("data-selected")).toBe("true");
        expect(getTile(fixture, 1).getAttribute("aria-selected")).toBe("true");
    });

    it("updates the bound value when a tile is clicked", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;

        getTile(fixture, 0).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#111111");
        expect(getTile(fixture, 0).getAttribute("data-selected")).toBe("true");
    });

    it("clears the bound value when the selected tile is clicked", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;

        getTile(fixture, 1).click();
        await waitForStable(fixture);

        expect(component.value()).toBeNull();
        expect(getTile(fixture, 1).getAttribute("data-selected")).toBe("false");
    });

    it("does not change value or leave tiles focusable when disabled", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;
        component.disabled.set(true);
        await waitForStable(fixture);

        getTile(fixture, 0).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#222222");
        expect(getPalette(fixture).getAttribute("aria-disabled")).toBe("true");
        expect(getTiles(fixture).every(tile => tile.getAttribute("tabindex") === "-1")).toBe(true);
    });

    it("does not change value when readonly and keeps tiles focusable", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;
        component.readonlyState.set(true);
        await waitForStable(fixture);

        getTile(fixture, 0).click();
        await waitForStable(fixture);

        expect(component.value()).toBe("#222222");
        expect(getPalette(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(getTile(fixture, 0).getAttribute("data-readonly")).toBe("true");
        expect(getTile(fixture, 0).getAttribute("tabindex")).toBe("0");
    });
});

describe("ColorPaletteComponent signal forms", () => {
    it("hydrates the selected tile from the signal form value", async () => {
        const fixture = await createSignalFormFixture();

        expect(getTile(fixture, 0).getAttribute("data-selected")).toBe("true");
    });

    it("updates the signal form value and touched state from tile clicks", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;

        getTile(fixture, 1).click();
        await waitForStable(fixture);

        expect(component.form.color().value()).toBe("#222222");
        expect(component.form.color().touched()).toBe(true);
    });

    it("reflects signal form readonly state and prevents value changes", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;
        component.readonlyState.set(true);
        await waitForStable(fixture);

        getTile(fixture, 1).click();
        await waitForStable(fixture);

        const palette = getPalette(fixture);
        expect(component.form.color().value()).toBe("#111111");
        expect(component.form.color().touched()).toBe(false);
        expect(palette.getAttribute("aria-readonly")).toBe("true");
        expect(palette.getAttribute("data-readonly")).toBe("true");
    });

    it("reflects required invalid state on the host", async () => {
        const fixture = await createSignalFormFixture();
        const component = fixture.componentInstance;
        component.requiredState.set(true);
        component.form.color().value.set(null);
        component.form.color().markAsTouched();
        await waitForStable(fixture);

        const palette = getPalette(fixture);
        expect(component.form.color().invalid()).toBe(true);
        expect(palette.getAttribute("aria-invalid")).toBe("true");
        expect(palette.getAttribute("aria-required")).toBe("true");
        expect(palette.getAttribute("data-invalid")).toBe("true");
        expect(palette.getAttribute("data-required")).toBe("true");
        expect(palette.className).toContain("data-[invalid='true']:border-error");
    });
});

describe("ColorPaletteComponent keyboard navigation", () => {
    it("moves the active tile and roving tabindex with ArrowRight", async () => {
        const fixture = await createValueBindingFixture();

        dispatchKeyDown(getTile(fixture, 0), "ArrowRight");
        await waitForKeyboardNavigation(fixture);

        expect(getTile(fixture, 0).getAttribute("tabindex")).toBe("-1");
        expect(getTile(fixture, 1).getAttribute("tabindex")).toBe("0");
    });

    it("moves the active tile to the last color on End", async () => {
        const fixture = await createValueBindingFixture();

        dispatchKeyDown(getTile(fixture, 0), "End");
        await waitForKeyboardNavigation(fixture);

        const lastIndex = getTiles(fixture).length - 1;
        expect(getTile(fixture, lastIndex).getAttribute("tabindex")).toBe("0");
        expect(getTile(fixture, 0).getAttribute("tabindex")).toBe("-1");
    });

    it("moves the active tile back to the first color on Home", async () => {
        const fixture = await createValueBindingFixture();

        dispatchKeyDown(getTile(fixture, 0), "End");
        await waitForKeyboardNavigation(fixture);
        dispatchKeyDown(getTile(fixture, getTiles(fixture).length - 1), "Home");
        await waitForKeyboardNavigation(fixture);

        expect(getTile(fixture, 0).getAttribute("tabindex")).toBe("0");
    });

    it("selects the focused color on Enter", async () => {
        const fixture = await createValueBindingFixture();
        const component = fixture.componentInstance;

        dispatchKeyDown(getTile(fixture, 0), "Enter");
        await waitForKeyboardNavigation(fixture);

        expect(component.value()).toBe("#111111");
    });
});

describe("ColorPaletteComponent multi-instance focus isolation", () => {
    it("does not change tabindex on a second instance when navigating the first", async () => {
        await TestBed.configureTestingModule({
            imports: [MultiInstanceColorPaletteHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(MultiInstanceColorPaletteHostComponent);
        await waitForStable(fixture);

        const firstRoot = fixture.nativeElement.querySelector("#first") as HTMLElement;
        const secondRoot = fixture.nativeElement.querySelector("#second") as HTMLElement;
        const secondTilesBefore = tilesWithin(secondRoot).map(tile => tile.getAttribute("tabindex"));

        dispatchKeyDown(tilesWithin(firstRoot)[0], "ArrowRight");
        await waitForKeyboardNavigation(fixture);

        expect(tilesWithin(firstRoot)[1].getAttribute("tabindex")).toBe("0");
        expect(tilesWithin(secondRoot).map(tile => tile.getAttribute("tabindex"))).toEqual(secondTilesBefore);
    });
});

describe("ColorPaletteComponent palette resolution", () => {
    it("resolves the flat, material, and websafe palette types", async () => {
        await TestBed.configureTestingModule({
            imports: [PaletteResolutionHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(PaletteResolutionHostComponent);
        await waitForStable(fixture);

        const cases: [PaletteType, typeof flatColorScheme][] = [
            ["flat", flatColorScheme],
            ["material", materialColorScheme],
            ["websafe", websafeColorScheme]
        ];

        for (const [paletteType, scheme] of cases) {
            fixture.componentInstance.palette.set(paletteType);
            await waitForStable(fixture);

            expect(getTiles(fixture).length).toBe(scheme.colors.length);
            expect(hostGridColumns(fixture)).toBe(scheme.columns);
        }
    });

    it("falls back to the flat color scheme for an empty custom palette", async () => {
        await TestBed.configureTestingModule({
            imports: [PaletteResolutionHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(PaletteResolutionHostComponent);
        fixture.componentInstance.palette.set([]);
        await waitForStable(fixture);

        expect(getTiles(fixture).length).toBe(flatColorScheme.colors.length);
        expect(hostGridColumns(fixture)).toBe(flatColorScheme.columns);
    });

    it("clamps custom palette columns to the lesser of the palette size and the columns input", async () => {
        await TestBed.configureTestingModule({
            imports: [PaletteResolutionHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(PaletteResolutionHostComponent);
        fixture.componentInstance.palette.set(LARGE_TEST_PALETTE);
        fixture.componentInstance.columns.set(5);
        await waitForStable(fixture);

        expect(getTiles(fixture).length).toBe(LARGE_TEST_PALETTE.length);
        expect(hostGridColumns(fixture)).toBe(5);
    });
});

describe("ColorPaletteComponent styling", () => {
    it("applies the rounded variant class to color tiles", async () => {
        await TestBed.configureTestingModule({
            imports: [RoundedVariantHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(RoundedVariantHostComponent);
        fixture.componentInstance.rounded.set("full");
        await waitForStable(fixture);

        expect(getTile(fixture, 0).className).toContain("rounded-full");
    });
});

describe("ColorPaletteComponent ARIA structure", () => {
    it("wraps every gridcell in a row so the grid role has required children", async () => {
        const fixture = await createValueBindingFixture();

        for (const tile of getTiles(fixture)) {
            expect(tile.parentElement?.getAttribute("role")).toBe("row");
        }
    });
});

async function createValueBindingFixture(): Promise<ComponentFixture<ValueBindingColorPaletteHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [ValueBindingColorPaletteHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(ValueBindingColorPaletteHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function createSignalFormFixture(): Promise<ComponentFixture<SignalFormColorPaletteHostComponent>> {
    await TestBed.configureTestingModule({
        imports: [SignalFormColorPaletteHostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalFormColorPaletteHostComponent);
    await waitForStable(fixture);
    return fixture;
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getPalette(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector("mona-color-palette") as HTMLElement;
}

function getTile(fixture: ComponentFixture<unknown>, index: number): HTMLElement {
    return getTiles(fixture)[index];
}

function getTiles(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("[data-color-index]")) as HTMLElement[];
}

function tilesWithin(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll("[data-color-index]")) as HTMLElement[];
}

function hostGridColumns(fixture: ComponentFixture<unknown>): number {
    const columns = getPalette(fixture).style.gridTemplateColumns.match(/repeat\((\d+),/);
    return columns ? Number(columns[1]) : NaN;
}

function dispatchKeyDown(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

async function waitForKeyboardNavigation(fixture: ComponentFixture<unknown>): Promise<void> {
    await waitForStable(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    await waitForStable(fixture);
}

interface ColorPaletteFormModel {
    color: string | null;
}
