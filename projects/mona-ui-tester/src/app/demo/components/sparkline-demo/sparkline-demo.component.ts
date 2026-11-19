import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { SparklineComponent, SparklineMarker } from "@nanahoshi/mona-ui/sparkline";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { SparklineDemoChartComponent } from "./sparkline-demo-chart.component";

const MARKER_CHOICES: readonly { readonly text: string; readonly value: readonly SparklineMarker[] }[] = [
    { text: "None", value: [] },
    { text: "Last", value: ["last"] },
    { text: "Lowest and highest", value: ["min", "max"] },
    { text: "All", value: ["first", "last", "min", "max"] }
];

@Component({
    selector: "app-sparkline-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./sparkline-demo.component.html"
})
export class SparklineDemoComponent extends AbstractDemoComponent<SparklineComponent> {
    protected readonly config = computed<ComponentConfig<SparklineComponent>>(() => ({
        inputs: deriveInputConfig<SparklineComponent>(this.metadata(), {
            // The sentence names the sparkline, and its values and their format are fixed.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            color: {
                type: "color",
                value: ""
            },
            curve: {
                type: "dropdown",
                value: ["linear", "monotone-x", "natural", "step", "step-after"],
                defaultValue: "linear"
            },
            markers: {
                type: "customDropdown",
                value: MARKER_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: MARKER_CHOICES[0].value
            },
            negativeColor: {
                type: "color",
                value: ""
            },
            type: {
                type: "dropdown",
                value: ["line", "area", "column", "win-loss"],
                defaultValue: "line"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("SparklineComponent");
    protected readonly wrapperComponent = SparklineDemoChartComponent;
}
