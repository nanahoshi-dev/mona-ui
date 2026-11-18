import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { BadgeDirective } from "@nanahoshi/mona-ui/badge";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-badge-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./badge-demo.component.html"
})
export class BadgeDemoComponent extends AbstractDemoComponent<BadgeDirective> {
    protected readonly config = computed<ComponentConfig<BadgeDirective>>(() => ({
        inputs: deriveInputConfig<BadgeDirective>(this.metadata(), {
            fill: {
                type: "dropdown",
                value: ["solid", "subtle", "outline"],
                defaultValue: "solid"
            },
            look: {
                type: "dropdown",
                value: ["secondary", "primary", "success", "warning", "error", "info"],
                defaultValue: "secondary"
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
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("BadgeDirective");
    protected readonly wrapperComponent = BadgeWrapperComponent;
}

@Component({
    imports: [BadgeDirective],
    template: `
        <span monaBadge [fill]="fill()" [look]="look()" [rounded]="rounded()" [size]="size()" [class]="userClass()">
            Beta
        </span>
    `
})
class BadgeWrapperComponent implements ComponentInputsAsSignal<BadgeDirective> {
    public readonly fill = input<ReturnType<BadgeDirective["fill"]>>("solid");
    public readonly look = input<ReturnType<BadgeDirective["look"]>>("secondary");
    public readonly rounded = input<ReturnType<BadgeDirective["rounded"]>>("medium");
    public readonly size = input<ReturnType<BadgeDirective["size"]>>("medium");
    public readonly userClass = input<string, ClassInputType>("", {
        transform: value => classInputToClass(value)
    });
}
