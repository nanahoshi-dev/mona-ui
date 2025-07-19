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
        <button monaButton #tooltipAnchor>Tooltip</button>
        <mona-tooltip [target]="tooltipAnchor" [position]="position()">
            <div class="p-2">This is a <span class="text-green-600 font-semibold">tooltip</span>.</div>
        </mona-tooltip>
    `
})
class TooltipWrapperComponent implements ComponentInputsAsSignal<TooltipComponent> {
    public readonly position = input<ReturnType<TooltipComponent["position"]>>("top");
}
