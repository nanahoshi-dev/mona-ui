import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, model, signal } from "@angular/core";
import {
    SegmentedComponent,
    SegmentedItemTemplateDirective,
    type SegmentedOption,
    type SegmentedValue
} from "@nanahoshi/mona-ui/segmented";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-segmented-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./segmented-demo.component.html"
})
export class SegmentedDemoComponent extends AbstractDemoComponent<SegmentedComponent> {
    readonly #injector = createFeatureInjector({
        itemTemplate: {
            name: "Item Template",
            description: "This template allows you to customize the visual content of every segmented option.",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<SegmentedComponent>>({
        code: `
            <mona-segmented
                aria-label="Course section"
                [disabled]="disabled()"
                [options]="options"
                [rounded]="rounded()"
                [size]="size()"
                [(value)]="value"
                class="w-full">
            </mona-segmented>

            <span>Selected value: {{ value() }}</span>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            value: {
                type: "dropdown",
                value: ["discover", "courses", "archived"],
                defaultValue: "discover"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SegmentedComponent");
    protected readonly SegmentedWrapperComponent = SegmentedWrapperComponent;
}

@Component({
    imports: [SegmentedComponent, SegmentedItemTemplateDirective],
    template: `
        @let featureData = features();
        <div class="flex w-full flex-col items-center gap-4">
            <mona-segmented
                aria-label="Course section"
                [disabled]="disabled()"
                [options]="options()"
                [rounded]="rounded()"
                [size]="size()"
                [(value)]="value">
                @if (featureData["itemTemplate"].active) {
                    <ng-template monaSegmentedItemTemplate let-option>
                        <span class="flex items-center gap-1.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {{ option.label }}
                        </span>
                    </ng-template>
                }
            </mona-segmented>
            <span>Selected value: {{ value() }}</span>
        </div>
    `
})
class SegmentedWrapperComponent implements ComponentInputsAsSignal<SegmentedComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input(false);
    public readonly options = input<readonly SegmentedOption[]>([
        { label: "Discover", value: "discover" },
        { label: "My courses", value: "courses" },
        { label: "Archived", value: "archived", disabled: true }
    ]);
    public readonly rounded = input<ReturnType<SegmentedComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<SegmentedComponent["size"]>>("medium");
    public readonly value = model<SegmentedValue | null>("discover");
}
