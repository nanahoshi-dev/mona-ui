import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { customColorPalette } from "../../utils/customColorPalette";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./color-picker-demo.component.html"
})
export class ColorPickerDemoComponent extends AbstractDemoComponent<ColorPickerComponent> {
    readonly #injector = createFeatureInjector({
        customPalette: {
            code: ``,
            active: false,
            description: `A custom color palette that can be used to test the color picker component with a different set of colors.`,
            name: "Custom Palette"
        }
    });
    protected readonly config = signal<ComponentConfig<ColorPickerComponent>>({
        inputs: {
            ariaLabel: {
                type: "string",
                value: ""
            },
            ariaLabelledBy: {
                type: "string",
                value: ""
            },
            closeOnSelect: {
                type: "boolean",
                value: true
            },
            columns: {
                type: "number",
                value: 10
            },
            disabled: {
                type: "boolean",
                value: false
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            opacity: {
                type: "boolean",
                value: true
            },
            palette: {
                type: "dropdown",
                value: ["flat", "material", "websafe"],
                defaultValue: "flat"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            format: {
                type: "dropdown",
                value: ["hex", "rgb", "hsl"],
                defaultValue: "hex"
            },
            showButtons: {
                type: "boolean",
                value: true
            },
            showClearButton: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            tileSize: {
                type: "number",
                value: 24
            },
            view: {
                type: "dropdown",
                value: ["palette", "gradient"],
                defaultValue: "palette"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ColorPickerComponent");
    protected readonly ColorPickerWrapperComponent = ColorPickerWrapperComponent;
}

@Component({
    imports: [ColorPickerComponent, FormField],
    template: `
        @let customPaletteActive = features()["customPalette"] && features()["customPalette"].active;
        <div class="flex flex-col items-center gap-4">
            <span>Color: {{ form.color().value() }}</span>
            <mona-color-picker
                [aria-label]="ariaLabel()"
                [aria-labelledby]="ariaLabelledBy()"
                [closeOnSelect]="closeOnSelect()"
                [columns]="columns()"
                [format]="format()"
                [formField]="form.color"
                [opacity]="opacity()"
                [palette]="customPaletteActive ? customPalette : palette()"
                [rounded]="rounded()"
                [showButtons]="showButtons()"
                [showClearButton]="showClearButton()"
                [size]="size()"
                [tileSize]="tileSize()"
                [view]="view()"></mona-color-picker>
        </div>
    `
})
export class ColorPickerWrapperComponent implements ComponentInputsAsSignal<ColorPickerComponent> {
    readonly #formModel = signal<ColorPickerFormModel>({ color: null });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.color, { when: () => this.disabled() });
        readonly(schema.color, { when: () => this.readonly() });
        required(schema.color, { when: () => this.required() });
    });
    protected readonly customPalette = customColorPalette;
    public readonly ariaLabel = input("");
    public readonly ariaLabelledBy = input("");
    public readonly closeOnSelect = input(true, { transform: booleanAttribute });
    public readonly columns = input<ReturnType<ColorPickerComponent["columns"]>>(10);
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly format = input<ReturnType<ColorPickerComponent["format"]>>("hex");
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly opacity = input(true, { transform: booleanAttribute });
    public readonly palette = input<ReturnType<ColorPickerComponent["palette"]>>("flat");
    public readonly rounded = input<ReturnType<ColorPickerComponent["rounded"]>>("medium");
    public readonly showButtons = input(true, { transform: booleanAttribute });
    public readonly showClearButton = input(false, { transform: booleanAttribute });
    public readonly size = input<ReturnType<ColorPickerComponent["size"]>>("medium");
    public readonly tileSize = input<ReturnType<ColorPickerComponent["tileSize"]>>(24);
    public readonly view = input<ReturnType<ColorPickerComponent["view"]>>("palette");
}

interface ColorPickerFormModel {
    color: string | null;
}
