import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ProgressBarComponent, ProgressBarLabelTemplateDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-progress-bar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./progress-bar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarDemoComponent extends AbstractDemoComponent<ProgressBarComponent> {
    readonly #injector = createFeatureInjector({
        labelTemplate: {
            code: `
                 <mona-progress-bar>
                     <ng-template monaProgressBarLabelTemplate let-value let-min="min" let-max="max">
                        <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                     </ng-template>
                 </mona-progress-bar>
            `,
            active: false,
            description: "Custom label template for the progress bar",
            name: "Label Template"
        }
    });
    protected readonly config = signal<ComponentConfig<ProgressBarComponent>>({
        code: `
            <mona-progress-bar
                [animate]="animate()"
                [color]="color()"
                [disabled]="disabled()"
                [indeterminate]="indeterminate()"
                [labelPosition]="labelPosition()"
                [labelStyles]="labelStyles()"
                [labelVisible]="labelVisible()"
                [max]="max()"
                [min]="min()"
                [rounded]="rounded()"
                [value]="value()">
                <ng-template monaProgressBarLabelTemplate let-value let-min="min" let-max="max">
                    <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                </ng-template>
            </mona-progress-bar>
        `,
        inputs: {
            animate: {
                type: "boolean",
                value: true
            },
            color: {
                type: "color",
                value: ""
            },
            disabled: {
                type: "boolean",
                value: false
            },
            indeterminate: {
                type: "boolean",
                value: false
            },
            labelPosition: {
                type: "dropdown",
                value: ["start", "center", "end"],
                defaultValue: "center"
            },
            labelStyles: {
                type: "dropdown",
                value: [{}, { fontSize: "8px" }, { color: "red" }, { fontWeight: "bold" }],
                defaultValue: {},
                clearable: true
            },
            labelVisible: {
                type: "boolean",
                value: true
            },
            max: {
                type: "number",
                value: 100
            },
            min: {
                type: "number",
                value: 0
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "medium"
            },
            value: {
                type: "number",
                value: 25
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ProgressBarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ProgressBarWrapperComponent = ProgressBarWrapperComponent;
}

@Component({
    selector: "app-progress-bar-wrapper",
    template: `
        @let featureData = features();
        <mona-progress-bar
            [animate]="animate()"
            [color]="color()"
            [disabled]="disabled()"
            [indeterminate]="indeterminate()"
            [labelPosition]="labelPosition()"
            [labelStyles]="labelStyles()"
            [labelVisible]="labelVisible()"
            [max]="max()"
            [min]="min()"
            [rounded]="rounded()"
            [value]="value()">
            @if (featureData["labelTemplate"].active) {
                <ng-template monaProgressBarLabelTemplate let-value let-min="min" let-max="max">
                    <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                </ng-template>
            }
        </mona-progress-bar>
    `,
    imports: [ProgressBarComponent, ProgressBarLabelTemplateDirective],
    host: {
        class: "w-full"
    }
})
class ProgressBarWrapperComponent implements ComponentInputsAsSignal<ProgressBarComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly animate = input<ReturnType<ProgressBarComponent["animate"]>>(true);
    public readonly color = input<ReturnType<ProgressBarComponent["color"]>>(``);
    public readonly disabled = input(false);
    public readonly indeterminate = input(false);
    public readonly labelPosition = input<ReturnType<ProgressBarComponent["labelPosition"]>>("center");
    public readonly labelStyles = input<ReturnType<ProgressBarComponent["labelStyles"]>>({});
    public readonly labelVisible = input(true);
    public readonly max = input(100);
    public readonly min = input(0);
    public readonly rounded = input<ReturnType<ProgressBarComponent["rounded"]>>("medium");
    public readonly value = input(0);
}
