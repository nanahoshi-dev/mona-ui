import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import {
    CircularProgressBarComponent,
    CircularProgressBarLabelTemplateDirective
} from "@nanahoshi/mona-ui/circular-progress-bar";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const LABEL_TEMPLATE_CODE = `<ng-template monaCircularProgressBarLabelTemplate let-value let-min="min" let-max="max">
    <span class="text-xs px-2"> {{ value }} | {{ max }} </span>
</ng-template>`;

@Component({
    selector: "app-circular-progress-bar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./circular-progress-bar-demo.component.html"
})
export class CircularProgressBarDemoComponent extends AbstractDemoComponent<CircularProgressBarComponent> {
    readonly #injector = createFeatureInjector({
        labelTemplate: {
            code: LABEL_TEMPLATE_CODE,
            active: false,
            description: "Custom label template for the progress bar",
            name: "Label Template"
        }
    });
    protected readonly config = computed<ComponentConfig<CircularProgressBarComponent>>(() => ({
        inputs: deriveInputConfig<CircularProgressBarComponent>(this.metadata(), {
            color: {
                type: "color",
                value: ""
            },
            // The demo curates a size of 120 instead of the library's default of 100.
            size: {
                type: "number",
                value: 120
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            },
            // The demo curates an initial value of 25 instead of the library's default of 0.
            value: {
                type: "number",
                value: 25
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
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
            [animate]="animate()"
            [aria-label]="ariaLabel()"
            [aria-valuetext]="ariaValueText()"
            [color]="color()"
            [disabled]="disabled()"
            [indeterminate]="indeterminate()"
            [max]="max()"
            [min]="min()"
            [size]="size()"
            [thickness]="thickness()"
            [value]="value()"
            [class]="userClass()">
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
    public readonly animate = input(true);
    public readonly ariaLabel = input("");
    public readonly ariaValueText = input("");
    public readonly color = input<ReturnType<CircularProgressBarComponent["color"]>>(``);
    public readonly disabled = input(false);
    public readonly indeterminate = input(false);
    public readonly max = input(100);
    public readonly min = input(0);
    public readonly size = input(120);
    public readonly thickness = input(1);
    public readonly userClass = input("");
    public readonly value = input(0);
}
