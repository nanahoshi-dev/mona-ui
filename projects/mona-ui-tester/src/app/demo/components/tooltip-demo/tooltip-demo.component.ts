import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { TextBoxDirective } from "@mirei/mona-ui/text-box";
import { TooltipComponent } from "@mirei/mona-ui/tooltip";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tooltip-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tooltip-demo.component.html"
})
export class TooltipDemoComponent extends AbstractDemoComponent<TooltipComponent> {
    protected readonly config = signal<ComponentConfig<TooltipComponent>>({
        code: `
            <div class="flex flex-row flex-wrap items-center justify-center gap-8 border border-border p-4 mb-4">
                <button monaButton look="primary" #primary>Primary Button</button>
                <button monaButton>Button</button>
                <a href="#" class="ml-2">Link 1</a>
                <a href="#" class="ml-2">Link 2</a>
                <input type="text" class="w-32 text-box" monaTextBox />
            </div>

            <mona-tooltip
                [disabled]="disabled()"
                [hideDelay]="hideDelay()"
                [position]="position()"
                [rounded]="rounded()"
                [showDelay]="showDelay()"
                [target]="target()">
                <div class="p-2">This is a <span class="text-green-600 font-semibold">tooltip</span>.</div>
            </mona-tooltip>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            hideDelay: {
                type: "number",
                value: 0
            },
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
            showDelay: {
                type: "number",
                value: 0
            },
            target: {
                type: "dropdown",
                value: ["button[look='primary']", "button", "a", ".text-box"],
                defaultValue: "a"
            }
        }
    });
    protected readonly metadata = this.getMetadata("TooltipComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["TooltipDirective"]);
    protected readonly TooltipWrapperComponent = TooltipWrapperComponent;
}

@Component({
    imports: [ButtonDirective, TooltipComponent, TextBoxDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="flex flex-row flex-wrap items-center justify-center gap-8 border border-border p-4 mb-4">
            <button monaButton look="primary" #primary>Primary Button</button>
            <button monaButton>Button</button>
            <a href="#" class="ml-2">Link 1</a>
            <a href="#" class="ml-2">Link 2</a>
            <input type="text" class="w-32 text-box" monaTextBox />
        </div>

        <mona-tooltip
            [disabled]="disabled()"
            [hideDelay]="hideDelay()"
            [position]="position()"
            [rounded]="rounded()"
            [showDelay]="showDelay()"
            [target]="target()">
            <div class="p-2">This is a <span class="text-green-600 font-semibold">tooltip</span>.</div>
        </mona-tooltip>
    `
})
class TooltipWrapperComponent implements ComponentInputsAsSignal<TooltipComponent> {
    public readonly disabled = input<ReturnType<TooltipComponent["disabled"]>>(false);
    public readonly hideDelay = input<ReturnType<TooltipComponent["hideDelay"]>>(0);
    public readonly position = input<ReturnType<TooltipComponent["position"]>>("top");
    public readonly rounded = input<ReturnType<TooltipComponent["rounded"]>>("medium");
    public readonly showDelay = input<ReturnType<TooltipComponent["showDelay"]>>(0);
    public readonly target = input<ReturnType<TooltipComponent["target"]>>("button");
}
