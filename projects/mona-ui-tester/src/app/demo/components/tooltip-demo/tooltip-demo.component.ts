import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective, TooltipComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tooltip-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tooltip-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDemoComponent extends AbstractDemoComponent<TooltipComponent> {
    protected readonly config = signal<ComponentConfig<TooltipComponent>>({
        code: ``,
        inputs: {
            position: {
                type: "dropdown",
                value: ["top", "bottom", "left", "right"],
                defaultValue: "top"
            },
            rounded: {
                type: "dropdown",
                value: ["full", "large", "medium", "none", "small"],
                defaultValue: "medium"
            },
            target: {
                type: "dropdown",
                value: ["button", "a"],
                defaultValue: "a"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("TooltipComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly TooltipWrapperComponent = TooltipWrapperComponent;
}

@Component({
    imports: [ButtonDirective, TooltipComponent],
    template: `
        <div class="flex flex-row gap-10">
            <button monaButton #tooltipAnchor>Button</button>
            <a href="#" class="ml-2">Link</a>
            <span href="#" class="ml-2">Link</span>
        </div>

        <mona-tooltip [target]="target()" [position]="position()" [rounded]="rounded()">
            <div class="p-2">This is a <span class="text-green-600 font-semibold">tooltip</span>.</div>
        </mona-tooltip>
    `
})
class TooltipWrapperComponent implements ComponentInputsAsSignal<TooltipComponent> {
    public readonly position = input<ReturnType<TooltipComponent["position"]>>("top");
    public readonly rounded = input<ReturnType<TooltipComponent["rounded"]>>("medium");
    public readonly target = input<ReturnType<TooltipComponent["target"]>>("button");
}
