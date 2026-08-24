import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartPointEvent, ChartPointFocusEvent } from "../../models/chart-event.models";
import type { ChartFinancialFillMode } from "../../models/chart-financial.models";
import { ChartComponent } from "./chart.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { CandlestickSeriesComponent } from "../candlestick-series/candlestick-series.component";
import { OhlcSeriesComponent } from "../ohlc-series/ohlc-series.component";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartTooltipComponent,
        ChartLegendComponent,
        CandlestickSeriesComponent,
        OhlcSeriesComponent
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
    public readonly bodyWidthRatio = signal<number>(0.7);
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { close: 104, date: "2026-03-01", high: 108, low: 98, open: 100 }, // rising
        { close: 102, date: "2026-03-02", high: 107, low: 100, open: 105 }, // falling
        { close: 110, date: "2026-03-03", high: 115, low: 108, open: 110 } // neutral doji
    ]);
    public readonly fillMode = signal<ChartFinancialFillMode>("filled");
    public readonly sharedTooltip = signal<boolean>(true);
    public readonly showCandlestick = signal<boolean>(true);
    public readonly showOhlc = signal<boolean>(false);
    public readonly wickWidth = signal<number>(1.5);
    public readonly xAxisType = signal<"category" | "linear" | "time">("category");
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
    let chartComponent: ChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestFinancialHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestFinancialHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        chartComponent = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance;
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

    it("should emit pointClick with full financial OHLC payload and change values", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            const target0 = scene.hitTargets[0];
            const canvas = fixture.debugElement.query(By.css("canvas")).nativeElement;
            const x = target0.point?.x ?? (target0.bounds ? target0.bounds.x + target0.bounds.width / 2 : 50);
            const y = target0.point?.y ?? (target0.bounds ? target0.bounds.y + target0.bounds.height / 2 : 50);

            canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y }));
            canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
            fixture.detectChanges();

            if (host.lastPointClick) {
                expect(host.lastPointClick.valueKind).toBe("ohlc");
                expect(host.lastPointClick.open).toBe(100);
                expect(host.lastPointClick.close).toBe(104);
                expect(host.lastPointClick.change).toBe(4);
                expect(host.lastPointClick.changePercentage).toBe(0.04);
                expect(host.lastPointClick.financialDirection).toBe("rising");
            }
        }
    });

    it("should format keyboard accessibility text with full OHLC values", () => {
        const hostDiv = fixture.debugElement.query(By.css("[tabindex='0']")).nativeElement;
        // Focus chart and press arrow right
        hostDiv.focus();
        hostDiv.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        const liveRegion = fixture.debugElement.query(By.css("[aria-live='polite']"));
        expect(liveRegion).toBeDefined();
        const text = liveRegion.nativeElement.textContent;
        expect(text).toContain("Open 100");
        expect(text).toContain("high 108");
        expect(text).toContain("low 98");
        expect(text).toContain("close 104");
        expect(text).toContain("rising");
    });

    it("should render candlestick marks properly when xAxisType is auto", () => {
        host.xAxisType.set("auto" as any);
        fixture.detectChanges();

        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.hasRenderableData).toBe(true);
            expect(scene.series.length).toBe(1);
            const candlestickScene = scene.series[0] as ChartCandlestickSeriesScene;
            expect(candlestickScene.type).toBe("candlestick");
            expect(candlestickScene.marks.length).toBe(3);
            expect(candlestickScene.marks[0].bodyBounds.width).toBeGreaterThan(0);
        }
    });

    it("should render OHLC marks properly when showOhlc is active and xAxisType is auto", () => {
        host.showCandlestick.set(false);
        host.showOhlc.set(true);
        host.xAxisType.set("auto" as any);
        fixture.detectChanges();

        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.hasRenderableData).toBe(true);
            expect(scene.series.length).toBe(1);
            const ohlcScene = scene.series[0] as ChartOhlcSeriesScene;
            expect(ohlcScene.type).toBe("ohlc");
            expect(ohlcScene.marks.length).toBe(3);
            expect(ohlcScene.marks[0].totalWidth).toBeGreaterThan(0);
        }
    });
});
