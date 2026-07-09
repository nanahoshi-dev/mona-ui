import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-placeholder-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./placeholder-demo.component.html"
})
export class PlaceholderDemoComponent extends AbstractDemoComponent<PlaceholderComponent> {
    readonly #injector = createFeatureInjector({
        content: {
            active: false,
            hasCode: false,
            name: "Content",
            description: "Actual content instead of placeholder."
        },
        customContent: {
            active: true,
            hasCode: false,
            name: "Custom Content",
            description: "Display a custom content instead of a text for the placeholder content."
        }
    });
    protected readonly config = signal<ComponentConfig<PlaceholderComponent>>({
        inputs: {
            text: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("PlaceholderComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly PlaceholderWrapperComponent = PlaceholderWrapperComponent;
}

@Component({
    imports: [PlaceholderComponent],
    template: `
        @let featureData = features();
        <div class="flex items-center justify-center border border-border bg-background p-4 w-120 h-20 rounded-sm">
            @if (featureData["content"].active) {
                <div class="text-foreground">This is the actual content replacing the placeholder.</div>
            } @else {
                <mona-placeholder [text]="text()" class="select-none">
                    @if (featureData["customContent"].active) {
                        <div class="text-foreground italic">Custom Placeholder Content</div>
                    }
                </mona-placeholder>
            }
        </div>
    `
})
class PlaceholderWrapperComponent implements ComponentInputsAsSignal<PlaceholderComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly text = input<ReturnType<PlaceholderComponent["text"]>>("");
}
