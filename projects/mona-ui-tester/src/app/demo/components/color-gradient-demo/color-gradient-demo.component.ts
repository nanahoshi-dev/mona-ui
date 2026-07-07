import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { disabled, form, FormField } from "@angular/forms/signals";
import { ColorGradientComponent } from "mona-ui/color-gradient";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-gradient-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./color-gradient-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorGradientDemoComponent extends AbstractDemoComponent<ColorGradientComponent> {
    protected readonly ColorGradientWrapperComponent = ColorGradientWrapperComponent;
    protected readonly config = signal<ComponentConfig<ColorGradientComponent>>({
        code: `
            <mona-color-gradient
                [disabled]="disabled()"
                [format]="format()"
                [opacity]="opacity()"
                [rounded]="rounded()"
                [showButtons]="showButtons()"
                [showHexInput]="showHexInput()"
                [showColorInputs]="showColorInputs()"
                class="bg-accent-dark border border-border">
            </mona-color-gradient>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            format: {
                type: "dropdown",
                value: ["hex", "rgb"],
                defaultValue: "hex"
            },
            opacity: {
                type: "boolean",
                value: true
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            showButtons: {
                type: "boolean",
                value: false
            },
            showHexInput: {
                type: "boolean",
                value: true
            },
            showColorInputs: {
                type: "boolean",
                value: true
            }
        }
    });
    protected readonly metadata = this.getMetadata("ColorGradientComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
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
                class="bg-accent-dark border border-border">
            </mona-color-gradient>
        </div>
    `
})
export class ColorGradientWrapperComponent implements ComponentInputsAsSignal<ColorGradientComponent> {
    readonly #formModel = signal<ColorGradientFormModel>({ color: "" });
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.color, { when: () => this.disabled() });
    });
    public readonly disabled = input<ReturnType<ColorGradientComponent["disabled"]>>(false);
    public readonly format = input<ReturnType<ColorGradientComponent["format"]>>("hex");
    public readonly opacity = input<ReturnType<ColorGradientComponent["opacity"]>>(true);
    public readonly rounded = input<ReturnType<ColorGradientComponent["rounded"]>>("medium");
    public readonly showButtons = input<ReturnType<ColorGradientComponent["showButtons"]>>(true);
    public readonly showHexInput = input<ReturnType<ColorGradientComponent["showHexInput"]>>(true);
    public readonly showColorInputs = input<ReturnType<ColorGradientComponent["showColorInputs"]>>(true);
}

interface ColorGradientFormModel {
    color: string;
}
