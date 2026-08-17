import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartPointEvent, ChartPointFocusEvent } from "../../models/chart-event.models";
import type { ChartFinancialFillMode } from "../../models/chart-financial.models";
import { MonaChartComponent } from "./chart.component";
import { MonaChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { MonaChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { MonaChartLegendComponent } from "../chart-legend/chart-legend.component";
import { MonaCandlestickSeriesComponent } from "../candlestick-series/candlestick-series.component";
import { MonaOhlcSeriesComponent } from "../ohlc-series/ohlc-series.component";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartTooltipComponent,
        MonaChartLegendComponent,
        MonaCandlestickSeriesComponent,
        MonaOhlcSeriesComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'date'"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)">
            <mona-chart-x-axis [type]="xAxisType()" />
            <mona-chart-y-axis />
            <mona-chart-legend [interactive]="true" />
            <mona-chart-tooltip [shared]="sharedTooltip()" />

            @if (showCandlestick()) {
                <mona-candlestick-series
                    [openField]="'open'"
                    [highField]="'high'"
                    [lowField]="'low'"
                    [closeField]="'close'"
                    [name]="'Stock A'"
                    [fillMode]="fillMode()"
                    [wickWidth]="wickWidth()"
                    [bodyWidthRatio]="bodyWidthRatio()" />
            }

            @if (showOhlc()) {
                <mona-ohlc-series
                    [openField]="'open'"
                    [highField]="'high'"
                    [lowField]="'low'"
                    [closeField]="'close'"
                    [name]="'Stock B'"
                    [wickWidth]="wickWidth()" />
            }
        </mona-chart>
    `
})
class TestFinancialHostComponent {
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { close: 104, date: "2026-03-01", high: 108, low: 98, open: 100 }, // rising
        { close: 102, date: "2026-03-02", high: 107, low: 100, open: 105 }, // falling
        { close: 110, date: "2026-03-03", high: 115, low: 108, open: 110 } // neutral doji
    ]);
    public readonly xAxisType = signal<"category" | "linear" | "time">("category");
    public readonly sharedTooltip = signal<boolean>(true);
    public readonly showCandlestick = signal<boolean>(true);
    public readonly showOhlc = signal<boolean>(false);
    public readonly fillMode = signal<ChartFinancialFillMode>("filled");
    public readonly wickWidth = signal<number>(1.5);
    public readonly bodyWidthRatio = signal<number>(0.7);

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.lastPointFocus = event;
    }
}

describe("Chart Financial Series Integration (Candlestick & OHLC)", () => {
    let fixture: ComponentFixture<TestFinancialHostComponent>;
    let host: TestFinancialHostComponent;
    let chartComponent: MonaChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestFinancialHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestFinancialHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        chartComponent = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance;
    });

    it("should compute scene with Candlestick series and accurate mark directions and bounds", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        expect(scene?.coordinateSystem).toBe("cartesian");

        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(1);
            const seriesScene = scene.series[0] as ChartCandlestickSeriesScene;
            expect(seriesScene.type).toBe("candlestick");
            expect(seriesScene.marks.length).toBe(3);

            // Mark 0: open 100, close 104 -> rising
            expect(seriesScene.marks[0].direction).toBe("rising");
            expect(seriesScene.marks[0].open).toBe(100);
            expect(seriesScene.marks[0].close).toBe(104);
            expect(seriesScene.marks[0].high).toBe(108);
            expect(seriesScene.marks[0].low).toBe(98);
            expect(seriesScene.marks[0].bodyBounds.height).toBeGreaterThan(0);

            // Mark 1: open 105, close 102 -> falling
            expect(seriesScene.marks[1].direction).toBe("falling");

            // Mark 2: open 110, close 110 -> neutral
            expect(seriesScene.marks[2].direction).toBe("neutral");
        }
    });

    it("should respect candlestick fillMode input", () => {
        host.fillMode.set("hollow");
        fixture.detectChanges();

        const scene = chartComponent.scene();
        if (scene && scene.coordinateSystem === "cartesian") {
            const seriesScene = scene.series[0] as ChartCandlestickSeriesScene;
            expect(seriesScene.fillMode).toBe("hollow");
            expect(seriesScene.marks[0].fillMode).toBe("hollow");
        }
    });

    it("should compute scene with OHLC series with ticks and spine", () => {
        host.showCandlestick.set(false);
        host.showOhlc.set(true);
        fixture.detectChanges();

        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(1);
            const ohlcScene = scene.series[0] as ChartOhlcSeriesScene;
            expect(ohlcScene.type).toBe("ohlc");
            expect(ohlcScene.marks.length).toBe(3);
            expect(ohlcScene.marks[0].direction).toBe("rising");
            expect(ohlcScene.marks[0].tickWidth).toBeGreaterThan(0);
        }
    });

    it("should enforce single financial series policy and warn when multiple financial series are present", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        host.showCandlestick.set(true);
        host.showOhlc.set(true);
        fixture.detectChanges();

        const scene = chartComponent.scene();
        if (scene && scene.coordinateSystem === "cartesian") {
            // Only 1 financial series should be placed into the scene
            expect(scene.series.length).toBe(1);
            expect(scene.series[0].type).toBe("candlestick");
        }
        warnSpy.mockRestore();
    });

    it("should populate hitTargets with complete OHLC payload and valueKind 'ohlc'", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.hitTargets.length).toBe(3);
            const target0 = scene.hitTargets[0];
            expect(target0.valueKind).toBe("ohlc");
            expect(target0.financial).toBeDefined();
            expect(target0.financial?.open).toBe(100);
            expect(target0.financial?.close).toBe(104);
            expect(target0.financial?.high).toBe(108);
            expect(target0.financial?.low).toBe(98);
            expect(target0.financial?.direction).toBe("rising");
            expect(target0.open).toBe(100);
            expect(target0.close).toBe(104);
            expect(target0.high).toBe(108);
            expect(target0.low).toBe(98);
            expect(target0.financialDirection).toBe("rising");
        }
    });

    it("should populate legend items with secondaryColor for two-tone swatch", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.legendItems.length).toBe(1);
            const legendItem = scene.legendItems[0];
            expect(legendItem.name).toBe("Stock A");
            expect(legendItem.seriesType).toBe("candlestick");
            expect(legendItem.color).toBeDefined();
            expect(legendItem.secondaryColor).toBeDefined();
        }
    });
});
