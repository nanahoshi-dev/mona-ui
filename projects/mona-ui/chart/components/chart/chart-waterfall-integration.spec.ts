import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { WaterfallSeriesComponent } from "../waterfall-series/waterfall-series.component";
import { ChartComponent } from "./chart.component";
import { ChartWaterfallLabelTemplateDirective } from "../../directives/chart-waterfall-label-template.directive";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { CartesianWaterfallChartScene } from "../../internal/scene/waterfall-scene";

@Component({
    imports: [
        ChartComponent,
        WaterfallSeriesComponent,
        ChartLegendComponent,
        ChartWaterfallLabelTemplateDirective
    ],
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
    it("renders waterfall chart scene with cumulative values and interactive legend", () => {
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

        // Interactive legend items generated for all 4 kinds present (Increase, Decrease, Subtotal, Total)
        const legendItems = scene.legendItems;
        expect(legendItems.length).toBe(4);
        expect(legendItems.map(i => i.name)).toEqual(["Increase", "Decrease", "Subtotal", "Total"]);
        expect(legendItems.every(i => i.kind === "datum" && i.interactive === true && i.visible === true)).toBe(true);

        // Custom template labels rendered
        const customLabels = fixture.nativeElement.querySelectorAll(".custom-wf-label");
        expect(customLabels.length).toBe(5);
        expect(customLabels[0].textContent).toContain("Initial: +100");
        expect(customLabels[1].textContent).toContain("Gain: +50");
        expect(customLabels[2].textContent).toContain("Loss: -30");

        // Toggle increase visibility via legend click
        chartComp.toggleLegendItem(legendItems[0]);
        fixture.detectChanges();
        chartComp.recomputeScene(ChartInvalidationReason.Visibility);

        const updatedScene = chartComp.scene() as CartesianWaterfallChartScene;
        expect(updatedScene.legendItems[0].visible).toBe(false);
        // Increase bars have renderOpacity 0, other bars remain rendered
        expect(updatedScene.series[0].bars[0].renderOpacity).toBe(0);
        expect(updatedScene.series[0].bars[1].renderOpacity).toBe(0);
        expect(updatedScene.series[0].bars[2].renderOpacity).toBe(1);
    });
});
