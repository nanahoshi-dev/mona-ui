import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective, TooltipDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tooltip-directive-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tooltip-directive-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDirectiveDemoComponent extends AbstractDemoComponent<TooltipDirective> {
    protected readonly config = signal<ComponentConfig<TooltipDirective>>({
        code: ``,
        inputs: {
            filter: {
                type: "dropdown",
                value: ["button[look='primary']", "button[look='error']", "button"],
                defaultValue: "button"
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
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("TooltipDirective");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly TooltipDirectiveWrapperComponent = TooltipDirectiveWrapperComponent;
}

@Component({
    imports: [TooltipDirective, ButtonDirective],
    template: `
        <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-2">
                <button
                    monaButton
                    look="primary"
                    title="This tooltip will not be shown on 'content' mode."
                    monaTooltip
                    [position]="position()"
                    [tooltipRounded]="rounded()"
                    [mode]="mode()">
                    Host Mode Tooltip
                </button>
                <p>Tooltip visible when mode is set to 'host'.</p>
            </div>
            <div
                class="flex flex-col gap-4"
                monaTooltip
                [filter]="filter()"
                [mode]="mode()"
                [position]="position()"
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
    public readonly filter = input<ReturnType<TooltipDirective["filter"]>>("button");
    public readonly mode = input<ReturnType<TooltipDirective["mode"]>>("host");
    public readonly position = input<ReturnType<TooltipDirective["position"]>>("top");
    public readonly rounded = input<ReturnType<TooltipDirective["rounded"]>>("medium");
}
