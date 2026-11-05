import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { FieldsetComponent, FieldsetLegendTemplateDirective } from "@nanahoshi/mona-ui/fieldset";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
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
    protected readonly config = computed<ComponentConfig<FieldsetComponent>>(() => ({
        inputs: deriveInputConfig<FieldsetComponent>(this.metadata(), {
            // The demo curates a non-empty starting legend instead of the library's "" default.
            legend: {
                type: "string",
                value: "Legend"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("FieldsetComponent");
    protected readonly FieldsetWrapperComponent = FieldsetWrapperComponent;
}

@Component({
    imports: [
        DropdownListComponent,
        FieldsetComponent,
        FieldsetLegendTemplateDirective,
        RatingComponent,
        SliderComponent,
        SwitchComponent
    ],
    template: `
        @let featureData = features();
        <mona-fieldset [legend]="legend()" [rounded]="rounded()" [disabled]="disabled()" [class]="userClass()">
            <div class="flex flex-col gap-3 p-2">
                <p>Turning on disabled disables every control inside.</p>
                <mona-switch aria-label="Notifications" />
                <mona-slider aria-label="Volume" class="w-64" />
                <mona-rating aria-label="Satisfaction" />
                <mona-dropdown-list aria-label="Season" class="w-64" [data]="seasons" />
                <input aria-label="Plain native input" class="w-64 border border-border p-1" type="text" />
            </div>
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
    protected readonly seasons = ["Spring", "Summer", "Autumn", "Winter"];
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly legend = input<ReturnType<FieldsetComponent["legend"]>>("");
    public readonly rounded = input<ReturnType<FieldsetComponent["rounded"]>>("medium");
    public readonly userClass = input<ReturnType<FieldsetComponent["userClass"]>>("");
}
