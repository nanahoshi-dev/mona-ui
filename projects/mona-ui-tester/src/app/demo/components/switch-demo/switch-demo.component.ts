import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideAngularModule, Moon, Sun } from "lucide-angular";
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
                <ng-template monaSwitchOffLabelTemplate>
                    <lucide-angular [name]="Moon" [size]="16" class="text-indigo-400"></lucide-angular>
                </ng-template>
            `,
            name: "Off Label Template",
            description: `This template is used to customize the off label of the switch.`,
            active: false
        },
        onLabelTemplate: {
            code: `
                <ng-template monaSwitchOnLabelTemplate>
                    <lucide-angular [name]="Sun" [size]="16" class="text-yellow-300"></lucide-angular>
                </ng-template>
            `,
            name: "On Label Template",
            description: `This template is used to customize the on label of the switch.`,
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<SwitchComponent>>({
        code: `
            <mona-switch
                [disabled]="disabled()"
                [offLabel]="offLabel()"
                [onLabel]="onLabel()"
                [rounded]="rounded()"
                [size]="size()">
                <ng-template monaSwitchOffLabelTemplate>
                    <lucide-angular [name]="Moon" [size]="16" class="text-indigo-400"></lucide-angular>
                </ng-template>
                <ng-template monaSwitchOnLabelTemplate>
                    <lucide-angular [name]="Sun" [size]="16" class="text-yellow-300"></lucide-angular>
                </ng-template>
                <ng-template monaSwitchHandleContentTemplate let-active>
                    @if (!active) {
                        <lucide-icon [name]="Moon" [size]="14" class="text-indigo-400"></lucide-icon>
                    } @else {
                        <lucide-icon [name]="Sun" [size]="14" class="text-yellow-300"></lucide-icon>
                    }
                </ng-template>
            </mona-switch>
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
        LucideAngularModule,
        SwitchOnLabelTemplateDirective,
        SwitchHandleContentTemplateDirective
    ],
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
                    <lucide-angular [name]="Moon" [size]="16" class="text-indigo-400"></lucide-angular>
                </ng-template>
            }
            @if (featureData && featureData["onLabelTemplate"].active) {
                <ng-template monaSwitchOnLabelTemplate>
                    <lucide-angular [name]="Sun" [size]="16" class="text-yellow-300"></lucide-angular>
                </ng-template>
            }
            @if (featureData && featureData["handleContentTemplate"].active) {
                <ng-template monaSwitchHandleContentTemplate let-active>
                    @if (!active) {
                        <lucide-icon [name]="Moon" [size]="14" class="text-indigo-400"></lucide-icon>
                    } @else {
                        <lucide-icon [name]="Sun" [size]="14" class="text-yellow-300"></lucide-icon>
                    }
                </ng-template>
            }
        </mona-switch>
    `
})
export class SwitchWrapperComponent implements ComponentInputsAsSignal<SwitchComponent> {
    protected readonly Moon = Moon;
    protected readonly Sun = Sun;
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input<ReturnType<SwitchComponent["disabled"]>>(false);
    public readonly offLabel = input<ReturnType<SwitchComponent["offLabel"]>>("");
    public readonly onLabel = input<ReturnType<SwitchComponent["onLabel"]>>("");
    public readonly rounded = input<ReturnType<SwitchComponent["rounded"]>>("full");
    public readonly size = input<ReturnType<SwitchComponent["size"]>>("medium");
}
