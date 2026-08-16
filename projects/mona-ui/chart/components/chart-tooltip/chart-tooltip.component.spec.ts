import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext } from "../../internal/context/chart-registration-context";
import type { ChartScene } from "../../internal/scene/chart-scene";
import type { ChartPoint } from "../../models/chart.models";
import type { ChartTooltipPointContext, ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import { MonaChartTooltipComponent } from "./chart-tooltip.component";

function createMockPointContext(x: string, y: string, yVal: number = 50): ChartTooltipPointContext {
    return {
        color: "#3b82f6",
        dataIndex: 0,
        datum: {},
        formattedX: x,
        formattedY: y,
        seriesId: "s1",
        seriesName: "Target",
        seriesType: "bar",
        xValue: x,
        yValue: yVal
    };
}

function createMockTemplateContext(point: ChartTooltipPointContext, shared: boolean = false): ChartTooltipTemplateContext {
    return {
        $implicit: point,
        point,
        points: [point],
        series: ["s1"],
        shared
    };
}

@Component({
    imports: [MonaChartTooltipComponent],
    template: `<mona-chart-tooltip [shared]="isShared()" />`
})
class TestHostComponent {
    public readonly isShared = signal(false);
}

describe("MonaChartTooltipComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let tooltipPositionSignal = signal<ChartPoint | null>(null);
    let tooltipContextSignal = signal<ChartTooltipTemplateContext | null>(null);
    let sceneSignal = signal<ChartScene | null>({
        axes: [],
        coordinateSystem: "cartesian",
        height: 400,
        hitTargets: [],
        plotRect: { height: 300, width: 700, x: 50, y: 50 },
        series: [],
        width: 800
    });

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: () => {},
        legendItems: signal([]),
        registerLegend: () => () => {},
        registerSeries: () => () => {},
        registerTooltip: () => () => {},
        registerXAxis: () => () => {},
        registerYAxis: () => () => {},
        scene: sceneSignal,
        toggleSeriesVisibility: () => {},
        tooltipContext: tooltipContextSignal,
        tooltipPosition: tooltipPositionSignal
    };

    beforeEach(async () => {
        tooltipPositionSignal = signal<ChartPoint | null>(null);
        tooltipContextSignal = signal<ChartTooltipTemplateContext | null>(null);
        sceneSignal = signal<ChartScene | null>({
            axes: [],
            coordinateSystem: "cartesian",
            height: 400,
            hitTargets: [],
            plotRect: { height: 300, width: 700, x: 50, y: 50 },
            series: [],
            width: 800
        });

        mockChartContext.tooltipPosition = tooltipPositionSignal;
        mockChartContext.tooltipContext = tooltipContextSignal;
        mockChartContext.scene = sceneSignal;

        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
    });

    it("should flip downwards with translateY(16px) when hovering near the top boundary (y < 140)", () => {
        tooltipPositionSignal.set({ x: 400, y: 50 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.nativeElement.style.transform).toContain("translateY(16px)");
    });

    it("should position upwards with translateY(-100%) when hovering with ample vertical clearance (y >= 140)", () => {
        tooltipPositionSignal.set({ x: 400, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.nativeElement.style.transform).toContain("translateY(-100%) translateY(-10px)");
    });

    it("should align right with translateX(-100%) when hovering near the right chart boundary", () => {
        // Chart width is 800, point x is 750 (> 800 - 140)
        tooltipPositionSignal.set({ x: 750, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Nov 23", "100", 100)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.nativeElement.style.transform).toContain("translateX(-100%)");
    });

    it("should align left with translateX(0%) when hovering near the left chart boundary", () => {
        // Point x is 50 (< 100)
        tooltipPositionSignal.set({ x: 50, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "10", 10)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.nativeElement.style.transform).toContain("translateX(0%)");
    });

    it("should center horizontally with translateX(-50%) when in the middle of the chart", () => {
        // Point x is 400 (between 100 and 660)
        tooltipPositionSignal.set({ x: 400, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("May", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.nativeElement.style.transform).toContain("translateX(-50%)");
    });
});
