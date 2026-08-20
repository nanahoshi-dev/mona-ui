import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toSelectedPoint } from "../../internal/selection/chart-selection-controller";
import { ChartDataLabelContextBuilder } from "../../internal/data-label/chart-data-label-context-builder";
import type { SceneHitTarget } from "../../internal/scene/scene-geometry";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";

@Component({
    selector: "test-stacked-host",
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'category'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis [axisId]="'yPrimary'" />
            <mona-bar-series
                [field]="'s1'"
                [name]="'Series 1'"
                [stack]="'normal'"
                [yAxisId]="'yPrimary'" />
            <mona-bar-series
                [field]="'s2'"
                [name]="'Series 2'"
                [stack]="'normal'"
                [yAxisId]="'yPrimary'" />
            <mona-chart-selection
                [mode]="'single'"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class StackedSelectionHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { category: "2026-Q1", s1: 40, s2: 30 },
        { category: "2026-Q2", s1: 50, s2: 20 }
    ]);
    public lastSelectionEvent: ChartSelectionChangeEvent | null = null;

    public onSelectionChange(event: ChartSelectionChangeEvent): void {
        this.lastSelectionEvent = event;
    }
}

@Component({
    selector: "test-percent-stacked-host",
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'category'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis [axisId]="'yPrimary'" />
            <mona-bar-series
                [field]="'s1'"
                [name]="'Series 1'"
                [stack]="'stack1'"
                [stackMode]="'percent'"
                [yAxisId]="'yPrimary'" />
            <mona-bar-series
                [field]="'s2'"
                [name]="'Series 2'"
                [stack]="'stack1'"
                [stackMode]="'percent'"
                [yAxisId]="'yPrimary'" />
            <mona-chart-selection
                [mode]="'single'"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class PercentStackedSelectionHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { category: "2026-Q1", s1: 25, s2: 75 },
        { category: "2026-Q2", s1: 40, s2: 60 }
    ]);
    public lastSelectionEvent: ChartSelectionChangeEvent | null = null;

    public onSelectionChange(event: ChartSelectionChangeEvent): void {
        this.lastSelectionEvent = event;
    }
}

describe("Chart Selected Point Semantic Context (GDSB-R4-004)", () => {
    const mockScene: CartesianXYChartScene = {
        axes: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        plotRect: { x: 40, y: 10, width: 500, height: 260 },
        series: [],
        width: 600
    };

    const currencyYAxis = {
        axis: "y" as const,
        axisId: "customY",
        axisLine: true,
        formatter: (v: unknown) => `$${Number(v).toFixed(2)}`,
        gridLines: true,
        isPrimary: true,
        position: "left" as const,
        ticks: [],
        title: "",
        visible: true
    };

    const percentYAxis = {
        axis: "y" as const,
        axisId: "percentY",
        axisLine: true,
        formatter: (v: unknown) => `${Number(v).toFixed(0)}%`,
        gridLines: true,
        isPrimary: true,
        position: "left" as const,
        ticks: [],
        title: "",
        visible: true
    };

    const currencyXAxis = {
        axis: "x" as const,
        axisId: "customX",
        axisLine: true,
        formatter: (v: unknown) => `$${Number(v).toFixed(2)}`,
        gridLines: true,
        isPrimary: true,
        position: "bottom" as const,
        ticks: [],
        title: "",
        visible: true
    };

    const percentXAxis = {
        axis: "x" as const,
        axisId: "percentX",
        axisLine: true,
        formatter: (v: unknown) => `${Number(v).toFixed(0)}%`,
        gridLines: true,
        isPrimary: true,
        position: "bottom" as const,
        ticks: [],
        title: "",
        visible: true
    };

    it("populates scalar xValue, yValue, and financial properties for vertical financial marks", () => {
        const financialHit: SceneHitTarget = {
            category: "2026-01-01",
            close: 150,
            datum: { date: "2026-01-01", open: 100, high: 160, low: 90, close: 150 },
            formattedCategory: "Jan 1, 2026",
            formattedValue: "150",
            high: 160,
            index: 0,
            low: 90,
            open: 100,
            seriesId: "candlestickSeries",
            seriesName: "Daily Stock",
            seriesType: "candlestick",
            value: 150,
            xKey: "2026-01-01",
            xValue: "2026-01-01"
        };

        const pt = toSelectedPoint(financialHit, mockScene);

        expect(pt.value).toBe(150);
        expect(pt.xValue).toBe("2026-01-01");
        expect(pt.yValue).toBe(150);
        expect(pt.open).toBe(100);
        expect(pt.high).toBe(160);
        expect(pt.low).toBe(90);
        expect(pt.close).toBe(150);
        expect(pt.markId).toBeDefined();
    });

    it("populates physical accumulated yValue and formattedY for vertical normal stacked marks", () => {
        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [currencyYAxis],
            orientation: "vertical",
            primaryYAxisId: "customY"
        };

        const hit: SceneHitTarget = {
            category: "Q1",
            dataIndex: 0,
            datum: { period: "Q1", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 70,
            stackMode: "normal",
            stackStart: 40,
            value: 30,
            xKey: "Q1",
            xValue: "Q1",
            yAxisId: "customY"
        };

        const pt = toSelectedPoint(hit, scene);

        expect(pt.value).toBe(30);
        expect(pt.xValue).toBe("Q1");
        expect(pt.yValue).toBe(70);
        expect(pt.stackEnd).toBe(70);
        expect(pt.stackStart).toBe(40);
    });

    it("populates physical accumulated xValue for horizontal normal stacked marks", () => {
        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [currencyXAxis],
            orientation: "horizontal",
            primaryXAxisId: "customX"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            category: "Q1",
            dataIndex: 0,
            datum: { period: "Q1", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 70,
            stackMode: "normal",
            stackStart: 40,
            value: 30,
            xAxisId: "customX",
            xKey: "Q1",
            xValue: 70
        };

        const pt = toSelectedPoint(hit, scene);

        expect(pt.value).toBe(30);
        expect(pt.xValue).toBe(70);
        expect(pt.yValue).toBe("Q1");
        expect(pt.stackEnd).toBe(70);
        expect(pt.stackStart).toBe(40);
    });

    it("populates physical percentage yValue for vertical percent stacked marks", () => {
        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [percentYAxis],
            orientation: "vertical",
            primaryYAxisId: "percentY"
        };

        const hit: SceneHitTarget = {
            category: "2026",
            dataIndex: 0,
            datum: { year: "2026", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 75,
            stackMode: "percent",
            stackPercentage: 0.75,
            stackStart: 45,
            value: 30,
            xKey: "2026",
            xValue: "2026",
            yAxisId: "percentY"
        };

        const pt = toSelectedPoint(hit, scene);

        expect(pt.value).toBe(30);
        expect(pt.xValue).toBe("2026");
        expect(pt.yValue).toBe(75);
        expect(pt.stackEnd).toBe(75);
        expect(pt.stackPercentage).toBe(0.75);
    });

    it("populates physical percentage xValue for horizontal percent stacked marks", () => {
        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [percentXAxis],
            orientation: "horizontal",
            primaryXAxisId: "percentX"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            category: "2026",
            dataIndex: 0,
            datum: { year: "2026", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 75,
            stackMode: "percent",
            stackPercentage: 0.75,
            stackStart: 45,
            value: 30,
            xAxisId: "percentX",
            xKey: "2026",
            xValue: 75
        };

        const pt = toSelectedPoint(hit, scene);

        expect(pt.value).toBe(30);
        expect(pt.xValue).toBe(75);
        expect(pt.yValue).toBe("2026");
        expect(pt.stackEnd).toBe(75);
        expect(pt.stackPercentage).toBe(0.75);
    });

    it("leaves value undefined for range marks while populating range bounds", () => {
        const hit: SceneHitTarget = {
            category: "Sprint 1",
            dataIndex: 0,
            datum: { task: "Sprint 1", from: 5, to: 15 },
            formattedFrom: "5",
            formattedTo: "15",
            fromValue: 5,
            index: 0,
            range: { fromValue: 5, toValue: 15, highValue: 15, lowValue: 5, formattedFrom: "5", formattedTo: "15" },
            seriesId: "rangeBarSeries",
            seriesName: "Tasks",
            seriesType: "rangeBar",
            toValue: 15,
            xKey: "Sprint 1",
            xValue: "Sprint 1"
        };

        const pt = toSelectedPoint(hit, mockScene);

        expect(pt.value).toEqual([5, 15]);
        expect(pt.fromValue).toBe(5);
        expect(pt.toValue).toBe(15);
        expect(pt.xValue).toBe("Sprint 1");
        expect(pt.yValue).toBeUndefined();
    });

    describe("Real Stacked Component Bed Integration", () => {
        beforeEach(async () => {
            vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
                bottom: 400,
                height: 400,
                left: 0,
                right: 600,
                top: 0,
                width: 600,
                x: 0,
                y: 0,
                toJSON: () => {}
            });
            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
                arc: vi.fn(),
                beginPath: vi.fn(),
                bezierCurveTo: vi.fn(),
                clearRect: vi.fn(),
                clip: vi.fn(),
                closePath: vi.fn(),
                createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
                createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
                fill: vi.fn(),
                fillRect: vi.fn(),
                fillText: vi.fn(),
                lineTo: vi.fn(),
                measureText: vi.fn().mockReturnValue({ width: 20 }),
                moveTo: vi.fn(),
                quadraticCurveTo: vi.fn(),
                rect: vi.fn(),
                restore: vi.fn(),
                save: vi.fn(),
                setLineDash: vi.fn(),
                setTransform: vi.fn(),
                stroke: vi.fn(),
                strokeRect: vi.fn(),
                strokeText: vi.fn()
            } as any);

            await TestBed.configureTestingModule({
                imports: [StackedSelectionHostComponent, PercentStackedSelectionHostComponent]
            }).compileComponents();
        });

        it("emits exact normal stacked scalar properties and maintains data-label parity for real generated scene", async () => {
            const fixture = TestBed.createComponent(StackedSelectionHostComponent);
            const host = fixture.componentInstance;
            fixture.detectChanges();
            await fixture.whenStable();

            const scene = host.chart().scene() as CartesianXYChartScene;
            expect(scene).not.toBeNull();

            const hitTarget = scene.hitTargets.find(t => t.seriesName === "Series 2" && (t.xKey === "2026-Q1" || t.category === "2026-Q1"));
            expect(hitTarget).toBeDefined();
            expect(hitTarget!.bounds).toBeDefined();

            const clickX = hitTarget!.bounds!.x + hitTarget!.bounds!.width / 2;
            const clickY = hitTarget!.bounds!.y + hitTarget!.bounds!.height / 2;

            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
            chartEl.dispatchEvent(new MouseEvent("click", { clientX: clickX, clientY: clickY, bubbles: true }));
            fixture.detectChanges();

            expect(host.lastSelectionEvent).not.toBeNull();
            expect(host.lastSelectionEvent!.visibleSelectedPoints.length).toBeGreaterThan(0);

            const pt = host.lastSelectionEvent!.visibleSelectedPoints.find(p => p.seriesName === "Series 2");
            expect(pt).toBeDefined();
            expect(pt!.markId).toBeDefined();
            expect(pt!.seriesId).toBeDefined();
            expect(pt!.value).toBe(30);
            expect(pt!.yValue).toBe(70);
            expect(pt!.stackStart).toBe(40);
            expect(pt!.stackEnd).toBe(70);

            // Parity with data-label semantic context builder
            const dlCtx = ChartDataLabelContextBuilder.buildContext(hitTarget!, false, "#3b82f6", scene);
            expect(dlCtx.value).toBe(pt!.value);
            expect(dlCtx.yValue).toBe(pt!.yValue);
            expect(dlCtx.xValue).toBe(pt!.xValue);
            expect(dlCtx.stackStart).toBe(pt!.stackStart);
            expect(dlCtx.stackEnd).toBe(pt!.stackEnd);
        });

        it("emits exact percent stacked scalar properties and maintains data-label parity for real generated scene", async () => {
            const fixture = TestBed.createComponent(PercentStackedSelectionHostComponent);
            const host = fixture.componentInstance;
            fixture.detectChanges();
            await fixture.whenStable();

            const scene = host.chart().scene() as CartesianXYChartScene;
            expect(scene).not.toBeNull();

            const hitTarget = scene.hitTargets.find(t => t.seriesName === "Series 2" && (t.xKey === "2026-Q1" || t.category === "2026-Q1"));
            expect(hitTarget).toBeDefined();
            expect(hitTarget!.bounds).toBeDefined();

            const clickX = hitTarget!.bounds!.x + hitTarget!.bounds!.width / 2;
            const clickY = hitTarget!.bounds!.y + hitTarget!.bounds!.height / 2;

            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
            chartEl.dispatchEvent(new MouseEvent("click", { clientX: clickX, clientY: clickY, bubbles: true }));
            fixture.detectChanges();

            expect(host.lastSelectionEvent).not.toBeNull();
            expect(host.lastSelectionEvent!.visibleSelectedPoints.length).toBeGreaterThan(0);

            const pt = host.lastSelectionEvent!.visibleSelectedPoints.find(p => p.seriesName === "Series 2");
            expect(pt).toBeDefined();
            expect(pt!.markId).toBeDefined();
            expect(pt!.seriesId).toBeDefined();
            expect(pt!.value).toBe(75);
            expect(pt!.yValue).toBe(100);
            expect(pt!.stackStart).toBe(25);
            expect(pt!.stackEnd).toBe(100);
            expect(pt!.stackPercentage).toBe(75);

            // Parity with data-label semantic context builder
            const dlCtx = ChartDataLabelContextBuilder.buildContext(hitTarget!, false, "#3b82f6", scene);
            expect(dlCtx.value).toBe(pt!.value);
            expect(dlCtx.yValue).toBe(pt!.yValue);
            expect(dlCtx.xValue).toBe(pt!.xValue);
            expect(dlCtx.stackStart).toBe(pt!.stackStart);
            expect(dlCtx.stackEnd).toBe(pt!.stackEnd);
            expect(dlCtx.stackPercentage).toBe(pt!.stackPercentage);
        });
    });
});
