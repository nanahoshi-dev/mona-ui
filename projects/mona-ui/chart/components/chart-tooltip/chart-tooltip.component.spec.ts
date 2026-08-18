import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext } from "../../internal/context/chart-registration-context";
import type { ChartScene } from "../../internal/scene/chart-scene";
import type { ChartPoint } from "../../models/chart.models";
import type { ChartTooltipPointContext, ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import { ChartTooltipComponent } from "./chart-tooltip.component";

function createMockPointContext(x: string, y: string, yVal: number = 50): ChartTooltipPointContext {
    return {
        color: "#3b82f6",
        dataIndex: 0,
        datum: {},
        formattedX: x,
        formattedY: y,
        markId: "s1:0",
        seriesId: "s1",
        seriesName: "Target",
        seriesType: "bar",
        xValue: x,
        yValue: yVal
    };
}

function createMockTemplateContext(
    point: ChartTooltipPointContext,
    shared: boolean = false
): ChartTooltipTemplateContext {
    return {
        $implicit: point,
        point,
        points: [point],
        series: ["s1"],
        shared
    };
}

@Component({
    imports: [ChartTooltipComponent],
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
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 400,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 400,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
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

    it("should place tooltip on bottom when hovering near top boundary", () => {
        tooltipPositionSignal.set({ x: 400, y: 20 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.attributes["data-placement"]).toBe("bottom");
        expect(parseFloat(tooltipEl.nativeElement.style.top)).toBeGreaterThan(20);
    });

    it("should place tooltip on top with gap when hovering with ample vertical clearance", () => {
        tooltipPositionSignal.set({ x: 400, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        expect(tooltipEl.attributes["data-placement"]).toBe("top");
        expect(parseFloat(tooltipEl.nativeElement.style.top)).toBeLessThan(200);
    });

    it("should clamp horizontal position when hovering near right chart boundary", () => {
        tooltipPositionSignal.set({ x: 790, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Nov 23", "100", 100)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        const left = parseFloat(tooltipEl.nativeElement.style.left);
        expect(left).toBeLessThanOrEqual(800 - 8);
    });

    it("should clamp horizontal position when hovering near left chart boundary", () => {
        tooltipPositionSignal.set({ x: 10, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("Jan", "10", 10)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        const left = parseFloat(tooltipEl.nativeElement.style.left);
        expect(left).toBeGreaterThanOrEqual(8);
    });

    it("should center horizontally when in the middle of the chart", () => {
        tooltipPositionSignal.set({ x: 400, y: 200 });
        tooltipContextSignal.set(createMockTemplateContext(createMockPointContext("May", "50", 50)));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl).not.toBeNull();
        const left = parseFloat(tooltipEl.nativeElement.style.left);
        expect(left).toBeGreaterThan(200);
        expect(left).toBeLessThan(400);
    });

    it("should render specialized funnel tooltip with conversion and drop-off", () => {
        tooltipPositionSignal.set({ x: 400, y: 200 });
        const funnelPoint: ChartTooltipPointContext = {
            ...createMockPointContext("Clicks", "400", 400),
            formattedCategory: "Clicks",
            funnel: {
                category: "Clicks",
                conversionRate: 0.4,
                dropOff: 600,
                formattedCategory: "Clicks",
                formattedConversionRate: "40%",
                formattedOverallConversionRate: "40%",
                formattedValue: "400",
                overallConversionRate: 0.4,
                previousValue: 1000,
                stageId: "clicks",
                stageIndex: 1,
                value: 400
            },
            seriesType: "funnel"
        };
        tooltipContextSignal.set(createMockTemplateContext(funnelPoint));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl.nativeElement.textContent).toContain("Clicks");
        expect(tooltipEl.nativeElement.textContent).toContain("Value: 400");
        expect(tooltipEl.nativeElement.textContent).toContain("Conversion: 40%");
        expect(tooltipEl.nativeElement.textContent).toContain("Drop-off: 600");
    });

    it("should render specialized waterfall tooltip with change delta and running total", () => {
        tooltipPositionSignal.set({ x: 400, y: 200 });
        const waterfallPoint: ChartTooltipPointContext = {
            ...createMockPointContext("Q1 Sales", "+50", 50),
            formattedCategory: "Q1 Sales",
            seriesType: "waterfall",
            waterfall: {
                barEnd: 150,
                barStart: 100,
                cumulativeAfter: 150,
                cumulativeBefore: 100,
                deltaValue: 50,
                formattedCumulativeAfter: "150",
                formattedCumulativeBefore: "100",
                formattedDelta: "+50",
                kind: "change",
                valueKind: "waterfall"
            }
        };
        tooltipContextSignal.set(createMockTemplateContext(waterfallPoint));
        fixture.detectChanges();

        const tooltipEl = fixture.debugElement.query(By.css("mona-chart-tooltip > div"));
        expect(tooltipEl.nativeElement.textContent).toContain("Q1 Sales");
        expect(tooltipEl.nativeElement.textContent).toContain("Change: +50");
        expect(tooltipEl.nativeElement.textContent).toContain("Running Total: 150");
    });
});
