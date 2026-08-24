import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ChartLegendComponent } from "../components/chart-legend/chart-legend.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { WaterfallSeriesComponent } from "../components/waterfall-series/waterfall-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartWaterfallLabelTemplateDirective } from "../directives/chart-waterfall-label-template.directive";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";
import type { CartesianWaterfallChartScene } from "../internal/scene/waterfall-scene";

@Component({
    imports: [ChartComponent, WaterfallSeriesComponent, ChartLegendComponent, ChartWaterfallLabelTemplateDirective],
    template: `
        <mona-chart [style.width.px]="600" [style.height.px]="400">
            <mona-waterfall-series
                [data]="data()"
                [field]="'value'"
                [xField]="'step'"
                [kindField]="'kind'"
                [showConnectors]="true"
                [showLabels]="true"
                [name]="'Cash Flow'">
                <ng-template monaChartWaterfallLabelTemplate let-point>
                    <span class="custom-wf-label">{{ point.category }}: {{ point.formattedValue }}</span>
                </ng-template>
            </mona-waterfall-series>
            <mona-chart-legend [interactive]="true" />
        </mona-chart>
    `
})
class TestWaterfallIntegrationComponent {
    public readonly data = signal<readonly unknown[]>([
        { step: "Initial", kind: "change", value: 100 },
        { step: "Gain", kind: "change", value: 50 },
        { step: "Loss", kind: "change", value: -30 },
        { step: "Subtotal", kind: "subtotal" },
        { step: "Final", kind: "total" }
    ]);
}

describe("ChartComponent Waterfall Integration", () => {
    it("renders waterfall chart scene with cumulative values and semantic noninteractive legend", () => {
        TestBed.configureTestingModule({
            imports: [TestWaterfallIntegrationComponent]
        });

        const fixture = TestBed.createComponent(TestWaterfallIntegrationComponent);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chartComp.scene() as CartesianWaterfallChartScene;

        expect(scene).not.toBeNull();
        expect(scene.cartesianKind).toBe("waterfall");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const bars = scene.series[0].bars;
        expect(bars.length).toBe(5);
        expect(bars[0].barEnd).toBe(100);
        expect(bars[1].barEnd).toBe(150);
        expect(bars[2].barEnd).toBe(120);
        expect(bars[3].barEnd).toBe(120);
        expect(bars[4].barEnd).toBe(120);

        // Connectors generated
        expect(scene.series[0].connectors.length).toBe(4);

        // Semantic presentation legend items generated for all 4 kinds present (Increase, Decrease, Subtotal, Total)
        const legendItems = scene.legendItems;
        expect(legendItems.length).toBe(4);
        expect(legendItems.map(i => i.name)).toEqual(["Increase", "Decrease", "Subtotal", "Total"]);
        expect(legendItems.every(i => i.kind === "semantic" && i.interactive === false && i.visible === true)).toBe(
            true
        );

        // Custom template labels rendered
        const customLabels = fixture.nativeElement.querySelectorAll(".custom-wf-label");
        expect(customLabels.length).toBe(5);
        expect(customLabels[0].textContent).toContain("Initial: +100");
        expect(customLabels[1].textContent).toContain("Gain: +50");
        expect(customLabels[2].textContent).toContain("Loss: -30");

        // Attempting to toggle a semantic legend item must not mutate scene or hide bars
        chartComp.toggleLegendItem(legendItems[0]);
        fixture.detectChanges();
        chartComp.recomputeScene(ChartInvalidationReason.Visibility);

        const updatedScene = chartComp.scene() as CartesianWaterfallChartScene;
        expect(updatedScene.legendItems[0].visible).toBe(true);
        expect(updatedScene.series[0].bars[0].renderOpacity).toBe(1);
        expect(updatedScene.series[0].bars[1].renderOpacity).toBe(1);
        expect(updatedScene.series[0].bars[2].renderOpacity).toBe(1);
        expect(updatedScene.series[0].bars.length).toBe(5);
        expect(updatedScene.series[0].connectors.length).toBe(4);
        expect(updatedScene.hitTargets.length).toBe(5);
    });

    it("forwards bar color as color and rendered label foreground as textColor in custom label template (FWF-C2)", () => {
        @Component({
            imports: [ChartComponent, WaterfallSeriesComponent, ChartWaterfallLabelTemplateDirective],
            template: `
                <mona-chart [style.width.px]="600" [style.height.px]="400">
                    <mona-waterfall-series
                        [data]="data"
                        [field]="'value'"
                        [xField]="'step'"
                        [kindField]="'kind'"
                        [increaseColor]="'#10b981'"
                        [decreaseColor]="'#ef4444'"
                        [showLabels]="true"
                        [minLabelWidth]="0">
                        <ng-template monaChartWaterfallLabelTemplate let-point>
                            <span
                                class="color-test-label"
                                [attr.data-fill]="point.color"
                                [attr.data-text]="point.textColor">
                                {{ point.category }}
                            </span>
                        </ng-template>
                    </mona-waterfall-series>
                </mona-chart>
            `
        })
        class CustomColorWaterfallComponent {
            public readonly data = [
                { kind: "change", step: "Gain", value: 100 },
                { kind: "change", step: "Loss", value: -50 }
            ];
        }

        TestBed.configureTestingModule({
            imports: [CustomColorWaterfallComponent]
        });

        const fixture = TestBed.createComponent(CustomColorWaterfallComponent);
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll(".color-test-label");
        expect(labels.length).toBe(2);

        // Increase bar: color is increase bar fill #10b981
        expect(labels[0].getAttribute("data-fill")).toBe("#10b981");
        expect(labels[0].getAttribute("data-text")).toBeDefined();

        // Decrease bar: color is decrease bar fill #ef4444
        expect(labels[1].getAttribute("data-fill")).toBe("#ef4444");
        expect(labels[1].getAttribute("data-text")).toBeDefined();
    });

    it("maintains canonical formattedCategory across axis, bar, hit target, and label when invalid source row is omitted (FWF-C3)", () => {
        @Component({
            imports: [ChartComponent, WaterfallSeriesComponent, ChartXAxisComponent],
            template: `
                <mona-chart [style.width.px]="600" [style.height.px]="400">
                    <mona-chart-x-axis [formatter]="formatter" />
                    <mona-waterfall-series [data]="data" [field]="'value'" [xField]="'step'" [kindField]="'kind'" />
                </mona-chart>
            `
        })
        class FormatterIndexWaterfallComponent {
            public readonly data = [
                { kind: "change", step: "Bad", value: "not-a-number" }, // source index 0: omitted
                { kind: "change", step: "Alpha", value: 100 }, // source index 1: retained
                { kind: "change", step: "Beta", value: -30 } // source index 2: retained
            ];
            public readonly formatter = (val: unknown, idx?: number) => `src-${idx}:${val}`;
        }

        TestBed.configureTestingModule({
            imports: [FormatterIndexWaterfallComponent]
        });

        const fixture = TestBed.createComponent(FormatterIndexWaterfallComponent);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chartComp.scene() as CartesianWaterfallChartScene;

        expect(scene.series[0].bars.length).toBe(2);
        // Both sceneBar and X axis tick must receive the canonical formatted string based on source index
        expect(scene.series[0].bars[0].formattedCategory).toBe("src-1:Alpha");
        expect(scene.series[0].bars[1].formattedCategory).toBe("src-2:Beta");

        const xAxisScene = scene.axes.find(a => a.axis === "x");
        expect(xAxisScene).toBeDefined();
        expect(xAxisScene?.ticks.length).toBe(2);
        expect(xAxisScene?.ticks[0].formattedValue).toBe("src-1:Alpha");
        expect(xAxisScene?.ticks[1].formattedValue).toBe("src-2:Beta");

        expect(scene.hitTargets[0].formattedCategory).toBe("src-1:Alpha");
        expect(scene.hitTargets[1].formattedCategory).toBe("src-2:Beta");
    });
});
