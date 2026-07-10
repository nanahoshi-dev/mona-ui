import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import {
    CircularProgressBarComponent,
    CircularProgressBarLabelTemplateDirective
} from "@nanahoshi/mona-ui/circular-progress-bar";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-circular-progress-bar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./circular-progress-bar-demo.component.html"
})
export class CircularProgressBarDemoComponent extends AbstractDemoComponent<CircularProgressBarComponent> {
    readonly #injector = createFeatureInjector({
        labelTemplate: {
            code: `
                 <mona-circular-progress-bar>
                     <ng-template monaCircularProgressBarLabelTemplate let-value let-min="min" let-max="max">
                        <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                     </ng-template>
                 </mona-circular-progress-bar>
            `,
            active: false,
            description: "Custom label template for the progress bar",
            name: "Label Template"
        }
    });
    protected readonly config = signal<ComponentConfig<CircularProgressBarComponent>>({
        code: `
            <mona-circular-progress-bar
                [color]="color()"
                [disabled]="disabled()"
                [indeterminate]="indeterminate()"
                [max]="max()"
                [min]="min()"
                [size]="size()"
                [thickness]="thickness()"
                [value]="value()">
                <ng-template monaCircularProgressBarLabelTemplate let-value let-min="min" let-max="max">
                    <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                </ng-template>
            </mona-circular-progress-bar>
        `,
        inputs: {
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
            max: {
                type: "number",
                value: 100
            },
            min: {
                type: "number",
                value: 0
            },
            size: {
                type: "number",
                value: 120
            },
            thickness: {
                type: "number",
                value: 6
            },
            value: {
                type: "number",
                value: 25
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("CircularProgressBarComponent");
    protected readonly CircularProgressBarWrapperComponent = CircularProgressBarWrapperComponent;
}

@Component({
    imports: [CircularProgressBarComponent, CircularProgressBarLabelTemplateDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-circular-progress-bar
            [color]="color()"
            [disabled]="disabled()"
            [indeterminate]="indeterminate()"
            [max]="max()"
            [min]="min()"
            [size]="size()"
            [thickness]="thickness()"
            [value]="value()">
            @if (featureData["labelTemplate"].active) {
                <ng-template monaCircularProgressBarLabelTemplate let-value let-min="min" let-max="max">
                    <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
                </ng-template>
            }
        </mona-circular-progress-bar>
    `
})
class CircularProgressBarWrapperComponent implements ComponentInputsAsSignal<CircularProgressBarComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly color = input<ReturnType<CircularProgressBarComponent["color"]>>(``);
    public readonly disabled = input(false);
    public readonly indeterminate = input(false);
    public readonly max = input(100);
    public readonly min = input(0);
    public readonly size = input(120);
    public readonly thickness = input(1);
    public readonly value = input(0);
}
