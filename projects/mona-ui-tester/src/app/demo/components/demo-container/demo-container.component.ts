import { Directionality } from "@angular/cdk/bidi";
import { Component, computed, DOCUMENT, inject, input, linkedSignal, output, signal } from "@angular/core";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import {
    buildActiveFeatureAttributes,
    buildActiveFeatureContent,
    generateComponentCodeSample
} from "../../utils/codeSample";
import { ComponentConfig, createComponentInputConfigArray, extractConfigValues } from "../../utils/componentConfig";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";
import { ConfigComponent } from "../config/config.component";
import { DemoToolbarComponent } from "../demo-toolbar/demo-toolbar.component";

@Component({
    selector: "app-demo-container",
    imports: [ConfigComponent, CodeViewerComponent, DemoToolbarComponent],
    templateUrl: "./demo-container.component.html",
    styles: [
        `
            .demo-code-panel-enter {
                animation: demo-code-panel-in 300ms ease-out;
            }

            .demo-code-panel-leave {
                animation: demo-code-panel-out 300ms ease-in;
            }

            @keyframes demo-code-panel-in {
                from {
                    grid-template-rows: 0fr;
                }

                to {
                    grid-template-rows: 1fr;
                }
            }

            @keyframes demo-code-panel-out {
                from {
                    grid-template-rows: 1fr;
                }

                to {
                    grid-template-rows: 0fr;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .demo-code-panel-enter,
                .demo-code-panel-leave {
                    animation-duration: 1ms;
                }
            }
        `
    ]
})
export class DemoContainerComponent<TComponent> {
    readonly #directionality = inject(Directionality);
    readonly #document = inject(DOCUMENT);
    readonly #metadataInputNames = computed(() => new Set((this.metadata().inputs ?? []).map(i => i.name)));
    protected readonly background = computed(() => {
        const customColor = this.customColor();
        if (customColor) {
            return customColor;
        }
        return ``;
    });
    protected readonly codeVisible = signal(false);
    protected readonly customColor = signal<string | null>(null);
    protected readonly direction = signal<"ltr" | "rtl">("ltr");
    protected readonly generatedCode = computed(() => {
        const features = this.config().featureHandler?.data();
        const metadataInputNames = this.#metadataInputNames();
        return generateComponentCodeSample(
            this.metadata().selector ?? "",
            createComponentInputConfigArray(this.config().inputs),
            this.liveValues(),
            features ? buildActiveFeatureAttributes(features, metadataInputNames) : [],
            features ? buildActiveFeatureContent(features, metadataInputNames) : []
        );
    });
    protected readonly liveValues = linkedSignal({
        source: signal({}),
        computation: () => extractConfigValues(this.config())
    });
    public readonly config = input.required<ComponentConfig<TComponent>>();
    public readonly metadata = input.required<ComponentMetadata>();
    public readonly valueChange = output<Record<string, unknown>>();

    protected onCodeToggle(): void {
        this.codeVisible.update(visible => !visible);
    }

    protected onDirectionChange(direction: "ltr" | "rtl"): void {
        this.direction.set(direction);
        this.#document.documentElement.setAttribute("dir", direction);
        this.#directionality.change.emit(direction);
    }

    protected onValueChange(value: Record<string, unknown>): void {
        this.liveValues.update(currentValues => ({ ...currentValues, ...value }));
        this.valueChange.emit(value);
    }
}
