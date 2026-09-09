import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { SkeletonComponent } from "@nanahoshi/mona-ui/skeleton";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-skeleton-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./skeleton-demo.component.html"
})
export class SkeletonDemoComponent extends AbstractDemoComponent<SkeletonComponent> {
    protected readonly config = computed<ComponentConfig<SkeletonComponent>>(() => ({
        inputs: deriveInputConfig<SkeletonComponent>(this.metadata(), {
            height: {
                type: "dropdown",
                value: ["1rem", "2rem", 64],
                defaultValue: "1rem"
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
            },
            width: {
                type: "dropdown",
                value: ["100%", "12rem", 320],
                defaultValue: "100%"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("SkeletonComponent");
    protected readonly SkeletonWrapperComponent = SkeletonWrapperComponent;
}

@Component({
    imports: [SkeletonComponent],
    template: `
        <mona-skeleton
            [height]="height()"
            [rounded]="rounded()"
            [width]="width()"
            [class]="userClass()"></mona-skeleton>
    `,
    host: {
        class: "w-full max-w-md"
    }
})
class SkeletonWrapperComponent implements ComponentInputsAsSignal<SkeletonComponent> {
    public readonly height = input<ReturnType<SkeletonComponent["height"]>>("1rem");
    public readonly rounded = input<ReturnType<SkeletonComponent["rounded"]>>("medium");
    public readonly userClass = input<string, ClassInputType>("", {
        transform: value => classInputToClass(value)
    });
    public readonly width = input<ReturnType<SkeletonComponent["width"]>>("100%");
}
