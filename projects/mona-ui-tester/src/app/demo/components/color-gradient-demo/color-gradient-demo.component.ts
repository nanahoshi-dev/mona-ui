import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input, signal } from "@angular/core";
import { disabled, form, FormField, required } from "@angular/forms/signals";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-gradient-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./color-gradient-demo.component.html"
})
export class ColorGradientDemoComponent extends AbstractDemoComponent<ColorGradientComponent> {
    protected readonly ColorGradientWrapperComponent = ColorGradientWrapperComponent;
    protected readonly config = computed<ComponentConfig<ColorGradientComponent>>(() => ({
        inputs: deriveInputConfig<ColorGradientComponent>(this.metadata(), {
            format: {
                type: "dropdown",
                value: ["hex", "rgb"],
                defaultValue: "hex"
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            // The demo curates showButtons off instead of the library's true default.
            showButtons: {
                type: "boolean",
                value: false
            }
        })
    }));
    protected readonly metadata = this.getMetadata("ColorGradientComponent");
}

@Component({
    imports: [ColorGradientComponent, FormField],
    template: `
        <div class="flex flex-col gap-2">
            <span>Color: {{ form.color().value() }}</span>
            <mona-color-gradient
                [format]="format()"
                [formField]="form.color"
                [opacity]="opacity()"
                [rounded]="rounded()"
                [showButtons]="showButtons()"
                [showHexInput]="showHexInput()"
                [showColorInputs]="showColorInputs()"
                class="bg-surface-raised border border-border-subtle shadow-control">
            </mona-color-gradient>
        </div>
    `
})
export class ColorGradientWrapperComponent implements ComponentInputsAsSignal<ColorGradientComponent> {
    readonly #formModel = signal<ColorGradientFormModel>({ color: "" });
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.color, { when: () => this.disabled() });
        required(schema.color, { when: () => this.required() });
    });
    public readonly disabled = input<ReturnType<ColorGradientComponent["disabled"]>>(false);
    public readonly format = input<ReturnType<ColorGradientComponent["format"]>>("hex");
    public readonly opacity = input<ReturnType<ColorGradientComponent["opacity"]>>(true);
    public readonly required = input<ReturnType<ColorGradientComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<ColorGradientComponent["rounded"]>>("medium");
    public readonly showButtons = input<ReturnType<ColorGradientComponent["showButtons"]>>(true);
    public readonly showHexInput = input<ReturnType<ColorGradientComponent["showHexInput"]>>(true);
    public readonly showColorInputs = input<ReturnType<ColorGradientComponent["showColorInputs"]>>(true);
}

interface ColorGradientFormModel {
    color: string;
}
