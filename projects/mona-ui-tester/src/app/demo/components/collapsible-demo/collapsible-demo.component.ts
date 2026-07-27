import { NgComponentOutlet } from "@angular/common";
import { Component, input, model, signal } from "@angular/core";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-collapsible-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./collapsible-demo.component.html"
})
export class CollapsibleDemoComponent extends AbstractDemoComponent<CollapsibleDirective> {
    protected readonly config = signal<ComponentConfig<CollapsibleDirective>>({
        code: `
            <section
                monaCollapsible
                [animate]="animate()"
                [disabled]="disabled()"
                [(expanded)]="expanded">
                <button monaCollapsibleTrigger type="button">
                    <span>Project details</span>
                    <span aria-hidden="true">{{ expanded() ? "−" : "+" }}</span>
                </button>
                <div monaCollapsibleContent>
                    <p>Content is revealed without adding a wrapper element.</p>
                </div>
            </section>
        `,
        inputs: {
            animate: {
                type: "boolean",
                value: true
            },
            disabled: {
                type: "boolean",
                value: false
            },
            expanded: {
                type: "boolean",
                value: false
            }
        }
    });
    protected readonly metadata = this.getMetadata("CollapsibleDirective");
    protected readonly CollapsibleWrapperComponent = CollapsibleWrapperComponent;
}

@Component({
    imports: [CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective],
    template: `
        <section
            monaCollapsible
            [animate]="animate()"
            [disabled]="disabled()"
            [(expanded)]="expanded"
            class="w-full overflow-hidden rounded-md border border-border bg-background">
            <button
                monaCollapsibleTrigger
                type="button"
                class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium text-foreground hover:bg-muted/50">
                <span>{{ expanded() ? "Hide project details" : "Show project details" }}</span>
                <span aria-hidden="true" class="text-muted-foreground">{{ expanded() ? "−" : "+" }}</span>
            </button>
            <div monaCollapsibleContent class="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                <p>
                    Collapsible content can be applied directly to any container. The directive keeps this
                    region inert while it is closed and animates its measured height when motion is enabled.
                </p>
            </div>
        </section>
    `,
    host: {
        class: "w-full max-w-xl"
    }
})
class CollapsibleWrapperComponent implements ComponentInputsAsSignal<CollapsibleDirective> {
    public readonly animate = input<ReturnType<CollapsibleDirective["animate"]>>(true);
    public readonly disabled = input<ReturnType<CollapsibleDirective["disabled"]>>(false);
    public readonly expanded = model<ReturnType<CollapsibleDirective["expanded"]>>(false);
}
