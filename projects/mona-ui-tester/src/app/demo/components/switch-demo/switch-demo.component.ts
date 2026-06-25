import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideMoon, LucideSun } from "@lucide/angular";
import {
    SwitchComponent,
    SwitchHandleContentTemplateDirective,
    SwitchOffLabelTemplateDirective,
    SwitchOnLabelTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-switch-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./switch-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchDemoComponent extends AbstractDemoComponent<SwitchComponent> {
    readonly #injector = createFeatureInjector({
        handleContentTemplate: {
            active: false,
            code: `
                <ng-template monaSwitchHandleContentTemplate>
                    <span class="text-xs text-gray-500">Custom Handle</span>
                </ng-template>
            `,
            description: `This template is used to customize the content inside the switch handle.`,
            name: "Handle Content Template"
        },
        offLabelTemplate: {
            code: `

            `,
            name: "Off Label Template",
            description: `This template is used to customize the off label of the switch.`,
            active: false
        },
        onLabelTemplate: {
            code: `

            `,
            name: "On Label Template",
            description: `This template is used to customize the on label of the switch.`,
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<SwitchComponent>>({
        code: `

        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            offLabel: {
                type: "string",
                value: ""
            },
            onLabel: {
                type: "string",
                value: ""
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "full"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SwitchComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly SwitchWrapperComponent = SwitchWrapperComponent;
}

@Component({
    imports: [
        SwitchComponent,
        SwitchOffLabelTemplateDirective,
        SwitchOnLabelTemplateDirective,
        SwitchHandleContentTemplateDirective,
        LucideMoon,
        LucideSun
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-switch
            [disabled]="disabled()"
            [offLabel]="offLabel()"
            [onLabel]="onLabel()"
            [rounded]="rounded()"
            [size]="size()">
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
    `
})
export class SwitchWrapperComponent implements ComponentInputsAsSignal<SwitchComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input<ReturnType<SwitchComponent["disabled"]>>(false);
    public readonly offLabel = input<ReturnType<SwitchComponent["offLabel"]>>("");
    public readonly onLabel = input<ReturnType<SwitchComponent["onLabel"]>>("");
    public readonly rounded = input<ReturnType<SwitchComponent["rounded"]>>("full");
    public readonly size = input<ReturnType<SwitchComponent["size"]>>("medium");
}
