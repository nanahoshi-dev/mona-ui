import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, required } from "@angular/forms/signals";
import { LucideMoon, LucideSun } from "@lucide/angular";
import {
    SwitchComponent,
    SwitchHandleContentTemplateDirective,
    SwitchOffLabelTemplateDirective,
    SwitchOnLabelTemplateDirective
} from "@nanahoshi/mona-ui/switch";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-switch-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./switch-demo.component.html"
})
export class SwitchDemoComponent extends AbstractDemoComponent<SwitchComponent> {
    readonly #injector = createFeatureInjector({
        handleContentTemplate: {
            active: false,
            description: `This template is used to customize the content inside the switch handle.`,
            name: "Handle Content Template"
        },
        offLabelTemplate: {
            name: "Off Label Template",
            description: `This template is used to customize the off label of the switch.`,
            active: false
        },
        onLabelTemplate: {
            name: "On Label Template",
            description: `This template is used to customize the on label of the switch.`,
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<SwitchComponent>>(() => ({
        inputs: deriveInputConfig<SwitchComponent>(this.metadata(), {
            ariaLabel: {
                alias: "aria-label",
                type: "string",
                value: ""
            },
            ariaLabelledBy: {
                alias: "aria-labelledby",
                type: "string",
                value: ""
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "full"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
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
    protected readonly metadata = this.getMetadata("SwitchComponent");
    protected readonly SwitchWrapperComponent = SwitchWrapperComponent;
}

@Component({
    imports: [
        SwitchComponent,
        SwitchOffLabelTemplateDirective,
        SwitchOnLabelTemplateDirective,
        SwitchHandleContentTemplateDirective,
        LucideMoon,
        LucideSun,
        FormField
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-2 items-center">
            <span
                >Switch Status: <span class="font-semibold">{{ form.switched().value() }}</span></span
            >
            <mona-switch
                [aria-label]="ariaLabel()"
                [aria-labelledby]="ariaLabelledBy()"
                [formField]="form.switched"
                [offLabel]="offLabel()"
                [onLabel]="onLabel()"
                [rounded]="rounded()"
                [size]="size()"
                [class]="userClass()">
                @if (featureData && featureData["offLabelTemplate"].active) {
                    <ng-template monaSwitchOffLabelTemplate>
                        <svg lucideMoon [size]="16" class="text-indigo-400"></svg>
                    </ng-template>
                }
                @if (featureData && featureData["onLabelTemplate"].active) {
                    <ng-template monaSwitchOnLabelTemplate>
                        <svg lucideSun [size]="16" class="text-yellow-300"></svg>
                    </ng-template>
                }
                @if (featureData && featureData["handleContentTemplate"].active) {
                    <ng-template monaSwitchHandleContentTemplate let-active>
                        @if (!active) {
                            <svg lucideMoon [size]="14" class="text-indigo-400"></svg>
                        } @else {
                            <svg lucideSun [size]="14" class="text-yellow-300"></svg>
                        }
                    </ng-template>
                }
            </mona-switch>
        </div>
    `
})
export class SwitchWrapperComponent implements ComponentInputsAsSignal<SwitchComponent> {
    readonly #formModel = signal<FormModel>({ switched: false });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.switched, { when: () => this.disabled() });
        required(schema.switched, { when: () => this.required() });
    });
    public readonly ariaLabel = input<ReturnType<SwitchComponent["ariaLabel"]>>("");
    public readonly ariaLabelledBy = input<ReturnType<SwitchComponent["ariaLabelledBy"]>>("");
    public readonly checked = model<ReturnType<SwitchComponent["checked"]>>(false);
    public readonly disabled = input<ReturnType<SwitchComponent["disabled"]>>(false);
    public readonly offLabel = input<ReturnType<SwitchComponent["offLabel"]>>("");
    public readonly onLabel = input<ReturnType<SwitchComponent["onLabel"]>>("");
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<SwitchComponent["rounded"]>>("full");
    public readonly size = input<ReturnType<SwitchComponent["size"]>>("medium");
    public readonly userClass = input<ReturnType<SwitchComponent["userClass"]>>("");

    public constructor() {
        effect(() => this.form.switched().value.set(this.checked()));
    }
}

interface FormModel {
    switched: boolean;
}
