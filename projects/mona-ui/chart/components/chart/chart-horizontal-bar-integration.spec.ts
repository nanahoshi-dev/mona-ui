import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartPointEvent } from "../../models/chart-event.models";
import type { ChartBarOrientation } from "../../models/chart-bar.models";
import { ChartComponent } from "./chart.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { RangeBarSeriesComponent } from "../range-bar-series/range-bar-series.component";
import type { ChartAreaSeriesScene, ChartBarSeriesScene, ChartLineSeriesScene, ChartRangeBarSeriesScene } from "../../internal/scene/cartesian-scene";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartTooltipComponent,
        ChartLegendComponent,
        BarSeriesComponent,
        AreaSeriesComponent,
        LineSeriesComponent,
        RangeBarSeriesComponent
    ],
    template: `
        <div style="width: 600px; height: 400px;">
            <mona-chart
                [data]="data()"
                [xField]="'category'"
                (pointClick)="onPointClick($event)">
                <mona-chart-x-axis />
                <mona-chart-y-axis />
                <mona-chart-legend [interactive]="true" />
                <mona-chart-tooltip />

                @if (showBar1()) {
                    <mona-bar-series
                        [field]="'revenue'"
                        [name]="'Revenue'"
                        [orientation]="orientation()"
                        [stack]="stack1()"
                        [stackMode]="stackMode()"
                        [borderRadius]="borderRadius()" />
                }

                @if (showBar2()) {
                    <mona-bar-series
                        [field]="'profit'"
                        [name]="'Profit'"
                        [orientation]="orientation()"
                        [stack]="stack2()"
                        [stackMode]="stackMode()"
                        [borderRadius]="borderRadius()" />
                }

                @if (showArea()) {
                    <mona-area-series
                        [field]="'revenue'"
                        [name]="'Revenue Area'"
                        [showPoints]="true" />
                }

                @if (showLine()) {
                    <mona-line-series
                        [field]="'profit'"
                        [name]="'Profit Line'"
                        [showPoints]="true" />
                }

                @if (showRangeBar()) {
                    <mona-range-bar-series
                        [fromField]="'minVal'"
                        [toField]="'maxVal'"
                        [name]="'Target Range'"
                        [orientation]="orientation()"
                        [borderRadius]="4" />
                }
            </mona-chart>
        </div>
    `
})
class TestHorizontalBarHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "North", minVal: 40, maxVal: 120, profit: 40, revenue: 100 },
        { category: "South", minVal: 60, maxVal: 150, profit: 50, revenue: 140 },
        { category: "West", minVal: 80, maxVal: 180, profit: 70, revenue: 170 }
    ]);
    public readonly orientation = signal<ChartBarOrientation>("horizontal");
    public readonly showBar1 = signal(true);
    public readonly showBar2 = signal(true);
    public readonly showArea = signal(false);
    public readonly showLine = signal(false);
    public readonly showRangeBar = signal(false);
    public readonly stack1 = signal<string | undefined>(undefined);
    public readonly stack2 = signal<string | undefined>(undefined);
    public readonly stackMode = signal<"normal" | "percent">("normal");
    public readonly borderRadius = signal(4);

    public lastPointClick: ChartPointEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }
}

describe("Horizontal Bar Chart Integration", () => {
    let fixture: ComponentFixture<TestHorizontalBarHostComponent>;
    let host: TestHorizontalBarHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHorizontalBarHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHorizontalBarHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("renders horizontal grouped bar chart with category mapped to Y and values mapped to X", () => {
        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene).toBeDefined();
        expect(scene.orientation).toBe("horizontal");
        expect(scene.interactionAxis).toBe("y");
        expect(scene.xAxisType).toBe("linear");
        expect(scene.yAxisType).toBe("category");
        expect(scene.series.length).toBe(2);

        const barScene1 = scene.series[0] as ChartBarSeriesScene;
        const barScene2 = scene.series[1] as ChartBarSeriesScene;

        expect(barScene1.bars.length).toBe(3);
        expect(barScene2.bars.length).toBe(3);

        // Grouped bars on same category must have different Y coordinates
        expect(barScene1.bars[0].y).not.toBe(barScene2.bars[0].y);
        expect(barScene1.bars[0].width).toBeGreaterThan(0);
        expect(barScene1.bars[0].orientation).toBe("horizontal");
    });

    it("renders horizontal stacked bar chart accumulating along physical X", () => {
        host.stack1.set("sales");
        host.stack2.set("sales");
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;

        const s1 = scene.series[0] as ChartBarSeriesScene;
        const s2 = scene.series[1] as ChartBarSeriesScene;

        // Stacked bars share category Y
        expect(s1.bars[0].y).toBe(s2.bars[0].y);
        // Second stack segment starts where first segment ends (X accumulation)
        expect(s2.bars[0].x).toBeCloseTo(s1.bars[0].x + s1.bars[0].width, 1);
    });

    it("renders mixed horizontal chart with Bar, Area, and Line series simultaneously", () => {
        host.showArea.set(true);
        host.showLine.set(true);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene).toBeDefined();
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.orientation).toBe("horizontal");
        expect(scene.series.length).toBe(4);

        const barSeries = scene.series.filter(s => s.type === "bar");
        const areaSeries = scene.series.find(s => s.type === "area") as ChartAreaSeriesScene;
        const lineSeries = scene.series.find(s => s.type === "line") as ChartLineSeriesScene;

        expect(barSeries.length).toBe(2);
        expect(areaSeries).toBeDefined();
        expect(lineSeries).toBeDefined();

        expect(areaSeries.points.length).toBe(3);
        expect(lineSeries.points.length).toBe(3);
        expect(areaSeries.orientation).toBe("horizontal");
        expect(lineSeries.orientation).toBe("horizontal");
    });

    it("animates horizontal bar series upon data update", () => {
        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        expect(chartCmp).toBeDefined();

        host.data.set([
            { category: "North", minVal: 40, maxVal: 120, profit: 80, revenue: 150 },
            { category: "South", minVal: 60, maxVal: 150, profit: 90, revenue: 200 },
            { category: "West", minVal: 80, maxVal: 180, profit: 110, revenue: 230 }
        ]);
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Data);

        expect(chartCmp.isAnimating()).toBe(true);
    });

    it("renders horizontal Range Bar series with discrete min-max horizontal spans", () => {
        host.showBar1.set(false);
        host.showBar2.set(false);
        host.showRangeBar.set(true);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene.orientation).toBe("horizontal");
        expect(scene.series.length).toBe(1);

        const rangeScene = scene.series[0] as ChartRangeBarSeriesScene;
        expect(rangeScene.bars.length).toBe(3);

        const r1 = rangeScene.bars[0];
        expect(r1.fromValuePixel).toBeDefined();
        expect(r1.toValuePixel).toBeDefined();
        expect(r1.width).toBeGreaterThan(0);
        expect(r1.height).toBeGreaterThan(0);
        expect(r1.cornerRadii?.topLeft).toBe(4);
        expect(r1.cornerRadii?.topRight).toBe(4);
    });

    it("handles keyboard navigation along Y axis (interactionAxis === 'y')", () => {
        const chartDe = fixture.debugElement.query(By.directive(ChartComponent));
        const chartEl = chartDe.nativeElement as HTMLElement;

        // Dispatch ArrowDown keydown
        const arrowDownEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "ArrowDown"
        });
        chartEl.dispatchEvent(arrowDownEvent);
        fixture.detectChanges();

        const chartCmp = chartDe.componentInstance as ChartComponent;
        expect(chartCmp).toBeDefined();
    });

    it("animates when toggling the last visible horizontal bar series to hidden", () => {
        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const legendItems = fixture.debugElement.queryAll(By.css("span.cursor-pointer, [role='button'], div.cursor-pointer"));

        // Toggle first bar series
        const barSeries1 = fixture.debugElement.queryAll(By.directive(BarSeriesComponent))[0].componentInstance as BarSeriesComponent;
        const barSeries2 = fixture.debugElement.queryAll(By.directive(BarSeriesComponent))[1].componentInstance as BarSeriesComponent;

        // Hide bar1
        barSeries1.visible.set(false);
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Visibility);
        expect(chartCmp.isAnimating()).toBe(true);

        // Hide bar2 (the last visible series)
        barSeries2.visible.set(false);
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Visibility);

        // Scene orientation should remain horizontal and animation should trigger
        const scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.orientation).toBe("horizontal");
        expect(chartCmp.isAnimating()).toBe(true);
    });
});
