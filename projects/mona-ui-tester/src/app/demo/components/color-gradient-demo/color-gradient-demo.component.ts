import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ColorGradientComponent } from "mona-ui";
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
        code: ``,
        inputs: {
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
            showRgbInput: {
                type: "boolean",
                value: true
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("ColorGradientComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [ColorGradientComponent],
    template: `
        <mona-color-gradient
            [format]="format()"
            [opacity]="opacity()"
            [rounded]="rounded()"
            [showButtons]="showButtons()"
            [showHexInput]="showHexInput()"
            [showRgbInput]="showRgbInput()"
            class="bg-accent-dark border border-border">
        </mona-color-gradient>
    `
})
export class ColorGradientWrapperComponent implements ComponentInputsAsSignal<ColorGradientComponent> {
    public readonly format = input<ReturnType<ColorGradientComponent["format"]>>("hex");
    public readonly opacity = input<ReturnType<ColorGradientComponent["opacity"]>>(true);
    public readonly rounded = input<ReturnType<ColorGradientComponent["rounded"]>>("medium");
    public readonly showButtons = input<ReturnType<ColorGradientComponent["showButtons"]>>(true);
    public readonly showHexInput = input<ReturnType<ColorGradientComponent["showHexInput"]>>(true);
    public readonly showRgbInput = input<ReturnType<ColorGradientComponent["showRgbInput"]>>(true);
}
