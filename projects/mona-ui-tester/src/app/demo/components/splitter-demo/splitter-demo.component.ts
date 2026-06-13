import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { compact } from "@mirei/ts-collections";
import { SplitterComponent, SplitterPaneComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-splitter-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./splitter-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitterDemoComponent extends AbstractDemoComponent<SplitterComponent> {
    readonly #injector = createFeatureInjector({
        collapsible: {
            code: ``,
            active: false,
            name: "Collapsible",
            description: "Allows the user to collapse the pane.",
            subFeatures: {
                collapsed: {
                    code: ``,
                    active: false,
                    name: "Collapsed",
                    description: "Expand/Collapse the first pane.",
                    type: "boolean"
                },
                collapsible: {
                    code: ``,
                    active: false,
                    name: "Collapsible",
                    description: "Allows the user to collapse the pane.",
                    type: "boolean"
                }
            }
        },
        resizable: {
            code: ``,
            active: false,
            name: "Resizable",
            description: "Allows the user to resize the pane."
        },
        size: {
            code: ``,
            active: false,
            name: "Size",
            description: "Initial size of the second pane.",
            subFeatures: {
                pane1: {
                    code: ``,
                    active: false,
                    name: "Pane 1",
                    description: "Initial size of the first pane.",
                    type: "number",
                    numericMin: 0,
                    numericValue: 64,
                    numericNullable: true
                },
                pane2: {
                    code: ``,
                    active: false,
                    name: "Pane 2",
                    description: "Initial size of the second pane.",
                    type: "number",
                    numericMin: 0,
                    numericValue: 96,
                    numericNullable: true
                },
                pane3: {
                    code: ``,
                    active: false,
                    name: "Pane 3",
                    description: "Initial size of the third pane.",
                    type: "number",
                    numericMin: 0,
                    numericNullable: true
                },
                min: {
                    code: ``,
                    active: false,
                    name: "Min",
                    description: "Minimum size of the Pane 2.",
                    type: "number",
                    numericMin: 0
                },
                max: {
                    code: ``,
                    active: false,
                    name: "Max",
                    description: "Maximum size of the Pane 2.",
                    type: "number",
                    numericMin: 0
                }
            }
        }
    });
    protected readonly config = signal<ComponentConfig<SplitterComponent>>({
        code: ``,
        inputs: {
            orientation: {
                type: "dropdown",
                value: ["horizontal", "vertical"],
                defaultValue: "vertical"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SplitterComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["SplitterPaneComponent"]);
    protected readonly SplitterWrapperComponent = SplitterWrapperComponent;
}

@Component({
    imports: [SplitterComponent, SplitterPaneComponent],
    template: `
        <mona-splitter [orientation]="orientation()" class="w-full h-full border border-border bg-background">
            <mona-splitter-pane
                [resizable]="resizable()"
                [collapsed]="collapsed()"
                [collapsible]="collapsible()"
                [size]="sizeList()[0]"
                (sizeChange)="onSizeChange('Pane 1', $event)">
                <div class="w-full h-full flex items-center justify-center text-xs" #pane1>
                    Pane 1 ({{ pane1.clientWidth }} x {{ pane1.clientHeight }})
                </div>
            </mona-splitter-pane>
            <mona-splitter-pane
                [resizable]="resizable()"
                [collapsible]="collapsible()"
                [size]="sizeList()[1]"
                [min]="minSize()"
                [max]="maxSize()"
                (sizeChange)="onSizeChange('Pane 2', $event)">
                <div class="w-full h-full flex items-center justify-center text-xs" #pane2>
                    Pane 2 ({{ pane2.clientWidth }} x {{ pane2.clientHeight }})
                </div>
            </mona-splitter-pane>
            <mona-splitter-pane
                [resizable]="resizable()"
                [collapsible]="collapsible()"
                [size]="sizeList()[2]"
                (sizeChange)="onSizeChange('Pane 3', $event)">
                <div class="w-full h-full flex items-center justify-center text-xs" #pane3>
                    Pane 3 ({{ pane3.clientWidth }} x {{ pane3.clientHeight }})
                </div>
            </mona-splitter-pane>
        </mona-splitter>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full h-64"
    }
})
class SplitterWrapperComponent implements ComponentInputsAsSignal<SplitterComponent> {
    protected readonly collapsed = computed(() => {
        const features = this.features();
        const subFeatures = features["collapsible"]?.subFeatures || {};
        return subFeatures["collapsed"]?.active ?? false;
    });
    protected readonly collapsible = computed(() => {
        const features = this.features();
        const subFeatures = features["collapsible"]?.subFeatures || {};
        return subFeatures["collapsible"]?.active ?? false;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly maxSize = computed(() => {
        const features = this.features();
        const subFeatures = features["size"]?.subFeatures || {};
        return subFeatures["max"]?.numericValue ?? Number.POSITIVE_INFINITY;
    });
    protected readonly minSize = computed(() => {
        const features = this.features();
        const subFeatures = features["size"]?.subFeatures || {};
        return subFeatures["min"]?.numericValue ?? 0;
    });
    protected readonly resizable = computed(() => {
        const features = this.features();
        return features["resizable"]?.active ?? false;
    });
    protected readonly sizeList = computed(() => {
        const features = this.features();
        const subFeatures = features["size"]?.subFeatures || {};
        const pane1 = subFeatures["pane1"]?.numericValue ?? 0;
        const pane2 = subFeatures["pane2"]?.numericValue ?? 0;
        const pane3 = subFeatures["pane3"]?.numericValue ?? 0;
        return compact([pane1, pane2, pane3]).toArray();
    });
    public readonly orientation = input<ReturnType<SplitterComponent["orientation"]>>("horizontal");

    protected onSizeChange(paneName: string, size: string | number) {
        console.log(paneName, size);
    }
}
