import { NgComponentOutlet } from "@angular/common";
import { Component, computed, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { customColorPalette } from "../../utils/customColorPalette";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-palette-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./color-palette-demo.component.html"
})
export class ColorPaletteDemoComponent extends AbstractDemoComponent<ColorPaletteComponent> {
    readonly #injector = createFeatureInjector({
        customPalette: {
            active: false,
            description: `A custom color palette that can be used to test the color palette component with a different set of colors.`,
            name: "Custom Palette"
        }
    });
    protected readonly config = computed<ComponentConfig<ColorPaletteComponent>>(() => ({
        inputs: deriveInputConfig<ColorPaletteComponent>(this.metadata(), {
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            palette: {
                type: "dropdown",
                value: ["flat", "material", "websafe"],
                defaultValue: "flat"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "none"
            },
            // The demo curates a tile size of 24 instead of the library's default of 18.
            tileSize: {
                type: "number",
                value: 24
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ColorPaletteComponent");
    protected readonly ColorPaletteWrapperComponent = ColorPaletteWrapperComponent;
}

@Component({
    imports: [ColorPaletteComponent, FormField],
    template: `
        @let customPaletteActive = features()["customPalette"] && features()["customPalette"].active;
        <div class="flex flex-col gap-4">
            <span>Color: {{ form.color().value() }}</span>
            <mona-color-palette
                [columns]="columns()"
                [formField]="form.color"
                [palette]="customPaletteActive ? customPalette : palette()"
                [rounded]="rounded()"
                [tileSize]="tileSize()"></mona-color-palette>
        </div>
    `
})
export class ColorPaletteWrapperComponent implements ComponentInputsAsSignal<ColorPaletteComponent> {
    readonly #formModel = signal<ColorPaletteFormModel>({ color: null });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.color, { when: () => this.disabled() });
        readonly(schema.color, { when: () => this.readonly() });
        required(schema.color, { when: () => this.required() });
    });
    protected readonly customPalette = customColorPalette;
    public readonly columns = input<ReturnType<ColorPaletteComponent["columns"]>>(10);
    public readonly disabled = input<ReturnType<ColorPaletteComponent["disabled"]>>(false);
    public readonly palette = input<ReturnType<ColorPaletteComponent["palette"]>>("flat");
    public readonly readonly = input<ReturnType<ColorPaletteComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<ColorPaletteComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<ColorPaletteComponent["rounded"]>>("none");
    public readonly tileSize = input<ReturnType<ColorPaletteComponent["tileSize"]>>(24);
}

interface ColorPaletteFormModel {
    color: string | null;
}
