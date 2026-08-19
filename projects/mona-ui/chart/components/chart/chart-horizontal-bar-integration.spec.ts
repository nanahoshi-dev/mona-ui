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
import { RangeBarSeriesRenderer } from "../../internal/render/series/range-bar-series-renderer";
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
                [aria-label]="ariaLabel()"
                [title]="title()"
                (pointClick)="onPointClick($event)">
                <mona-chart-x-axis />
                <mona-chart-y-axis />
                <mona-chart-legend [interactive]="true" />
                <mona-chart-tooltip />

                @if (showBar1()) {
                    <mona-bar-series
                        [field]="'revenue'"
                        [name]="'Revenue'"
                        [color]="bar1Color()"
                        [style.color]="bar1HostColor()"
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
                        [visible]="lineVisible()"
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
    public readonly ariaLabel = signal("");
    public readonly bar1Color = signal<string>("#3b82f6");
    public readonly bar1HostColor = signal<string | undefined>(undefined);
    public readonly data = signal<readonly unknown[]>([
        { category: "North", minVal: 40, maxVal: 120, profit: 40, revenue: 100 },
        { category: "South", minVal: 60, maxVal: 150, profit: 50, revenue: 140 },
        { category: "West", minVal: 80, maxVal: 180, profit: 70, revenue: 170 }
    ]);
    public readonly lineVisible = signal(true);
    public readonly orientation = signal<ChartBarOrientation>("horizontal");
    public readonly showBar1 = signal(true);
    public readonly showBar2 = signal(true);
    public readonly showArea = signal(false);
    public readonly showLine = signal(false);
    public readonly showRangeBar = signal(false);
    public readonly stack1 = signal<string | undefined>(undefined);
    public readonly stack2 = signal<string | undefined>(undefined);
    public readonly stackMode = signal<"normal" | "percent">("normal");
    public readonly title = signal("");
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

    it("safely fails safe when unsupported series (Area, Line) are visible with horizontal bars", () => {
        host.showArea.set(true);
        host.showLine.set(true);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartCmp.recomputeScene(ChartInvalidationReason.Data);
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene).toBeDefined();
        // Policy rejects incompatible mix: hasRenderableData is false and series array is empty
        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series.length).toBe(0);

        // Hiding incompatible series safely restores valid horizontal layout
        host.showArea.set(false);
        host.showLine.set(false);
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Data);

        const restoredScene = chartCmp.scene() as CartesianXYChartScene;
        expect(restoredScene.hasRenderableData).toBe(true);
        expect(restoredScene.orientation).toBe("horizontal");
        expect(restoredScene.series.length).toBe(2);
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
        const chartCmp = chartDe.componentInstance as ChartComponent;

        // Focus chart container
        chartEl.focus();

        // Dispatch ArrowDown keydown to navigate across categories
        chartEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
        fixture.detectChanges();

        expect(chartCmp).toBeDefined();

        // Dispatch ArrowUp keydown to navigate back
        chartEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowUp" }));
        fixture.detectChanges();

        // Dispatch ArrowRight keydown to navigate across series in current bucket
        chartEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
        fixture.detectChanges();
    });

    it("renders horizontal percent stacked bars summing to 100%", () => {
        host.stack1.set("sales");
        host.stack2.set("sales");
        host.stackMode.set("percent");
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene.orientation).toBe("horizontal");
        const s1 = scene.series[0] as ChartBarSeriesScene;
        const s2 = scene.series[1] as ChartBarSeriesScene;

        expect(s1.bars[0].stackPercentage).toBeDefined();
        expect(s2.bars[0].stackPercentage).toBeDefined();
        const totalPct = (s1.bars[0].stackPercentage ?? 0) + (s2.bars[0].stackPercentage ?? 0);
        expect(totalPct).toBeCloseTo(100, 0);
    });

    it("animates when toggling the last visible horizontal bar series to hidden", () => {
        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;

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

    it("recovers chart when invalid composition is resolved via interactive legend toggle (HAX-F03, HAX-F14)", () => {
        // Line series starts present in template but hidden
        host.showLine.set(true);
        host.lineVisible.set(false);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartCmp.recomputeScene(ChartInvalidationReason.Visibility);
        fixture.detectChanges();

        // Initially valid horizontal bar chart with 2 bars
        let scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(2);

        // Find legend buttons
        const legendDe = fixture.debugElement.query(By.directive(ChartLegendComponent));
        let legendButtons = legendDe.queryAll(By.css("button"));
        expect(legendButtons.length).toBe(3); // Revenue, Profit, Profit Line

        // Find "Profit Line" button and click it to make it visible
        const lineBtn = legendButtons.find(b => b.nativeElement.textContent.includes("Profit Line"))!;
        lineBtn.nativeElement.click();
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Visibility);
        fixture.detectChanges();

        // Now composition is invalid (horizontal Bar + visible Line)
        scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series.length).toBe(0);

        // CRITICAL CONTRACT: All 3 legend controls remain present and interactive in fail-safe scene
        legendButtons = legendDe.queryAll(By.css("button"));
        expect(legendButtons.length).toBe(3);

        // Click "Profit Line" legend button again to hide it
        const lineBtn2 = legendButtons.find(b => b.nativeElement.textContent.includes("Profit Line"))!;
        lineBtn2.nativeElement.click();
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Visibility);
        fixture.detectChanges();

        // Chart successfully recovers via legend interaction alone!
        scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.orientation).toBe("horizontal");
        expect(scene.series.length).toBe(2);
    });

    it("respects explicit [color] input precedence over host CSS color on horizontal bar series (HAX-3-005)", () => {
        host.bar1HostColor.set("rgb(16, 185, 129)");
        host.bar1Color.set("#9333ea");
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartCmp.recomputeScene(ChartInvalidationReason.Style);
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene.series[0].style.color).toBe("#9333ea");
    });

    it("resolves host CSS color bridge on horizontal bar series when explicit color is omitted (HAX-3-005)", () => {
        host.bar1HostColor.set("rgb(16, 185, 129)");
        host.bar1Color.set("");
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartCmp.recomputeScene(ChartInvalidationReason.Style);
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene.series[0].style.color).toBe("rgb(16, 185, 129)");
    });

    it("correctly integrates zero-length horizontal range bar with vertical hairline renderer (HAX-3-001, HAX-3-002)", () => {
        host.showBar1.set(false);
        host.showBar2.set(false);
        host.showRangeBar.set(true);
        host.data.set([{ category: "Q1", maxVal: 50, minVal: 50 }]);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartCmp.recomputeScene(ChartInvalidationReason.Data);
        const scene = chartCmp.scene() as CartesianXYChartScene;

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.orientation).toBe("horizontal");
        expect(scene.series.length).toBe(1);

        const rangeBarScene = scene.series[0] as ChartRangeBarSeriesScene;
        expect(rangeBarScene.bars.length).toBe(1);
        expect(rangeBarScene.bars[0].width).toBe(0);
        expect(rangeBarScene.bars[0].height).toBeGreaterThan(0);
        expect(rangeBarScene.bars[0].orientation).toBe("horizontal");

        // Pointer hit target retains forgiving tolerance while direct bounds is absent
        const hit = scene.hitTargets.find(h => h.seriesType === "rangeBar");
        expect(hit).toBeDefined();
        expect(hit?.bounds).toBeUndefined();
        expect(hit?.visualBounds?.width).toBe(4);
        expect(hit?.visualBounds?.x).toBe(rangeBarScene.bars[0].x - 2);

        // Renderer renders vertical hairline
        const mockCtx = {
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        RangeBarSeriesRenderer.render(mockCtx, rangeBarScene);
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.moveTo).toHaveBeenCalledWith(expect.any(Number), rangeBarScene.bars[0].y);
        expect(mockCtx.lineTo).toHaveBeenCalledWith(expect.any(Number), rangeBarScene.bars[0].y + rangeBarScene.bars[0].height);
        expect(mockCtx.stroke).toHaveBeenCalled();
        expect(mockCtx.fill).not.toHaveBeenCalled();
    });

    it("normalizes whitespace-only aria-label to title fallback (HAX-F08)", () => {
        host.ariaLabel.set("   ");
        host.title.set("Quarterly Revenue");
        fixture.detectChanges();

        const chartDe = fixture.debugElement.query(By.directive(ChartComponent));
        const ariaLabelAttr = chartDe.nativeElement.getAttribute("aria-label");
        expect(ariaLabelAttr).toBe("Quarterly Revenue");
    });

    it("animates smoothly with morph mode when switching orientation dynamically between horizontal and vertical", () => {
        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Data);

        let scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.orientation).toBe("horizontal");

        // Switch orientation to vertical
        host.orientation.set("vertical");
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Data);

        scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.orientation).toBe("vertical");
        expect(chartCmp.isAnimating()).toBe(true);

        // Switch back to horizontal
        host.orientation.set("horizontal");
        fixture.detectChanges();
        chartCmp.recomputeScene(ChartInvalidationReason.Data);

        scene = chartCmp.scene() as CartesianXYChartScene;
        expect(scene.orientation).toBe("horizontal");
        expect(chartCmp.isAnimating()).toBe(true);
    });
});
