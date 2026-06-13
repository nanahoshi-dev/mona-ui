import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { PlaceholderComponent } from "mona-ui";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { NgComponentOutlet } from "@angular/common";

@Component({
    selector: "app-placeholder-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./placeholder-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderDemoComponent extends AbstractDemoComponent<PlaceholderComponent> {
    readonly #injector = createFeatureInjector({
        content: {
            code: ``,
            active: false,
            hasCode: false,
            name: "Content",
            description: "Actual content instead of placeholder."
        },
        customContent: {
            code: ``,
            active: true,
            hasCode: false,
            name: "Custom Content",
            description: "Display a custom content instead of a text for the placeholder content."
        }
    });
    protected readonly config = signal<ComponentConfig<PlaceholderComponent>>({
        code: `
            @if (contentVisible()) {
                <div class="text-foreground">This is the actual content replacing the placeholder.</div>
            } @else {
                <mona-placeholder [text]="text()"> <!-- text input will take precedence over custom content -->
                    <div class="text-foreground italic">Custom Placeholder Content</div>
                </mona-placeholder>
            }
        `,
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
                <mona-placeholder [text]="text()">
                    @if (featureData["customContent"].active) {
                        <div class="text-foreground italic">Custom Placeholder Content</div>
                    }
                </mona-placeholder>
            }
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full flex items-center justify-center"
    }
})
class PlaceholderWrapperComponent implements ComponentInputsAsSignal<PlaceholderComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly text = input<ReturnType<PlaceholderComponent["text"]>>("");
}
