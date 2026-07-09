import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tooltip-directive-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tooltip-directive-demo.component.html"
})
export class TooltipDirectiveDemoComponent extends AbstractDemoComponent<TooltipDirective> {
    protected readonly config = signal<ComponentConfig<TooltipDirective>>({
        code: ``,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            filter: {
                type: "dropdown",
                value: ["button[look='primary']", "button[look='error']", "button"],
                defaultValue: "button"
            },
            hideDelay: {
                type: "number",
                value: 0
            },
            mode: {
                type: "dropdown",
                value: ["host", "content"],
                defaultValue: "host"
            },
            position: {
                type: "dropdown",
                value: ["top", "bottom", "left", "right"],
                defaultValue: "top"
            },
            rounded: {
                type: "dropdown",
                value: ["full", "large", "medium", "none", "small"],
                defaultValue: "medium",
                alias: "tooltipRounded"
            },
            showDelay: {
                type: "number",
                value: 0
            }
        }
    });
    protected readonly metadata = this.getMetadata("TooltipDirective");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly TooltipDirectiveWrapperComponent = TooltipDirectiveWrapperComponent;
}

@Component({
    imports: [TooltipDirective, ButtonDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-2">
                <button
                    monaButton
                    look="primary"
                    title="This tooltip will not be shown on 'content' mode."
                    monaTooltip
                    [disabled]="disabled()"
                    [hideDelay]="hideDelay()"
                    [mode]="mode()"
                    [position]="position()"
                    [showDelay]="showDelay()"
                    [tooltipRounded]="rounded()">
                    Host Mode Tooltip
                </button>
                <p>Tooltip visible when mode is set to 'host'.</p>
            </div>
            <div
                class="flex flex-col gap-4"
                monaTooltip
                [disabled]="disabled()"
                [filter]="filter()"
                [hideDelay]="hideDelay()"
                [mode]="mode()"
                [position]="position()"
                [showDelay]="showDelay()"
                [tooltipRounded]="rounded()">
                <div class="flex flex-col gap-2">
                    <button monaButton look="primary" title="This tooltip will be shown on 'content' mode.">
                        Content Mode Tooltip
                    </button>
                    <p>Tooltip visible when mode is set to <strong>'content'</strong>.</p>
                    <p>If filter is set to button[look='error'], tooltip won't be visible.</p>
                </div>
                <div class="flex flex-col gap-2">
                    <button monaButton look="error" title="This tooltip will be shown on 'content' mode.">
                        Content Mode Tooltip
                    </button>
                    <p>Tooltip visible when mode is set to 'content'.</p>
                    <p>If filter is set to button[look='primary'], tooltip won't be visible.</p>
                </div>
            </div>
        </div>
    `
})
class TooltipDirectiveWrapperComponent implements ComponentInputsAsSignal<TooltipDirective> {
    public readonly disabled = input<ReturnType<TooltipDirective["disabled"]>>(false);
    public readonly filter = input<ReturnType<TooltipDirective["filter"]>>("button");
    public readonly hideDelay = input<ReturnType<TooltipDirective["hideDelay"]>>(0);
    public readonly mode = input<ReturnType<TooltipDirective["mode"]>>("host");
    public readonly position = input<ReturnType<TooltipDirective["position"]>>("top");
    public readonly rounded = input<ReturnType<TooltipDirective["rounded"]>>("medium");
    public readonly showDelay = input<ReturnType<TooltipDirective["showDelay"]>>(0);
}
