import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ColorPickerComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { customColorPalette } from "../../utils/customColorPalette";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./color-picker-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
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
        code: ``,
        inputs: {
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
            showClearButton: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
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
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ColorPickerWrapperComponent = ColorPickerWrapperComponent;
}

@Component({
    imports: [ColorPickerComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let customPaletteActive = features()["customPalette"] && features()["customPalette"].active;
        <mona-color-picker
            [closeOnSelect]="closeOnSelect()"
            [columns]="columns()"
            [disabled]="disabled()"
            [opacity]="opacity()"
            [palette]="customPaletteActive ? customPalette : palette()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [view]="view()"></mona-color-picker>
    `
})
export class ColorPickerWrapperComponent implements ComponentInputsAsSignal<ColorPickerComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly customPalette = customColorPalette;
    public readonly closeOnSelect = input<ReturnType<ColorPickerComponent["closeOnSelect"]>>(true);
    public readonly columns = input<ReturnType<ColorPickerComponent["columns"]>>(10);
    public readonly disabled = input<ReturnType<ColorPickerComponent["disabled"]>>(false);
    public readonly opacity = input<ReturnType<ColorPickerComponent["opacity"]>>(true);
    public readonly palette = input<ReturnType<ColorPickerComponent["palette"]>>("flat");
    public readonly rounded = input<ReturnType<ColorPickerComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<ColorPickerComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<ColorPickerComponent["size"]>>("medium");
    public readonly view = input<ReturnType<ColorPickerComponent["view"]>>("palette");
}
