import { NgComponentOutlet } from "@angular/common";
import { Component, input, model, signal } from "@angular/core";
import { SegmentedComponent, type SegmentedOption, type SegmentedValue } from "@nanahoshi/mona-ui/segmented";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-segmented-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./segmented-demo.component.html"
})
export class SegmentedDemoComponent extends AbstractDemoComponent<SegmentedComponent> {
    protected readonly config = signal<ComponentConfig<SegmentedComponent>>({
        code: `
            <mona-segmented
                aria-label="Course section"
                [disabled]="disabled()"
                [options]="options"
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
        }
    });
    protected readonly metadata = this.getMetadata("SegmentedComponent");
    protected readonly SegmentedWrapperComponent = SegmentedWrapperComponent;
}

@Component({
    imports: [SegmentedComponent],
    template: `
        <div class="flex w-full flex-col items-center gap-4">
            <mona-segmented
                aria-label="Course section"
                [disabled]="disabled()"
                [options]="options()"
                [size]="size()"
                [(value)]="value"
                class="w-lg">
            </mona-segmented>
            <span>Selected value: {{ value() }}</span>
        </div>
    `
})
class SegmentedWrapperComponent implements ComponentInputsAsSignal<SegmentedComponent> {
    public readonly disabled = input(false);
    public readonly options = input<readonly SegmentedOption[]>([
        { label: "Discover", value: "discover" },
        { label: "My courses", value: "courses" },
        { label: "Archived", value: "archived", disabled: true }
    ]);
    public readonly size = input<ReturnType<SegmentedComponent["size"]>>("medium");
    public readonly value = model<SegmentedValue | null>("discover");
}
