import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { FieldsetComponent, FieldsetLegendTemplateDirective } from "@nanahoshi/mona-ui/fieldset";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { NgComponentOutlet } from "@angular/common";

@Component({
    selector: "app-fieldset-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./fieldset-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsetDemoComponent extends AbstractDemoComponent<FieldsetComponent> {
    readonly #injector = createFeatureInjector({
        legendTemplate: {
            code: ``,
            active: false,
            name: "Legend Template",
            description: "Use a custom template for the fieldset legend."
        }
    });
    protected readonly config = signal<ComponentConfig<FieldsetComponent>>({
        code: ``,
        inputs: {
            legend: {
                type: "string",
                value: "Legend"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            disabled: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("FieldsetComponent");
    protected readonly FieldsetWrapperComponent = FieldsetWrapperComponent;
}

@Component({
    imports: [FieldsetComponent, FieldsetLegendTemplateDirective],
    template: `
        @let featureData = features();
        <mona-fieldset [legend]="legend()" [rounded]="rounded()" [disabled]="disabled()">
            <p class="p-2">This is a fieldset content.</p>
            @if (featureData["legendTemplate"].active) {
                <ng-template monaFieldsetLegendTemplate>
                    <div class="text-emerald-600 font-medium">Custom Legend</div>
                </ng-template>
            }
        </mona-fieldset>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full flex items-center justify-center"
    }
})
class FieldsetWrapperComponent implements ComponentInputsAsSignal<FieldsetComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input<ReturnType<FieldsetComponent["disabled"]>>(false);
    public readonly legend = input<ReturnType<FieldsetComponent["legend"]>>("");
    public readonly rounded = input<ReturnType<FieldsetComponent["rounded"]>>("medium");
}
