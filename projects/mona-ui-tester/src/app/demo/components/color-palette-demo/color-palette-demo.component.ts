import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { ColorPaletteComponent } from "@mirei/mona-ui/color-palette";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
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
    protected readonly config = signal<ComponentConfig<ColorPaletteComponent>>({
        inputs: {
            columns: {
                type: "number",
                value: 10
            },
            disabled: {
                type: "boolean",
                value: false
            },
            palette: {
                type: "dropdown",
                value: ["flat", "material", "websafe"],
                defaultValue: "flat"
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "none"
            },
            tileSize: {
                type: "number",
                value: 24
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ColorPaletteComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
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
