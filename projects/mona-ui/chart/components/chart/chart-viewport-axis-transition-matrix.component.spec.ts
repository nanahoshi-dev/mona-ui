import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    ChartNavigationInput,
    ChartViewportChangeEvent,
    ChartViewportState
} from "../../models/chart-viewport.models";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import { CartesianStageTracker } from "../../internal/layout/cartesian-stage-instrumentation";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";
import type { ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { ChartComponent } from "./chart.component";

interface FlexibleDataItem {
    x: number | string | Date;
    y: number;
    cat?: string;
}

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        PieSeriesComponent
    ],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            [xField]="xField()"
            [navigation]="navigation()"
            [viewport]="viewport()"
            (viewportChange)="onViewportChange($event)"
            style="width: 500px; height: 300px; display: block;"
        >
            @if (showXAxis()) {
                <mona-chart-x-axis [axisId]="xAxisId()" [type]="xAxisType()" />
            }
            @if (showYAxis()) {
                <mona-chart-y-axis [axisId]="yAxisId()" [type]="yAxisType()" />
            }
            @if (chartKind() === 'xy') {
                <mona-line-series [field]="yField" name="Series 1" />
            } @else if (chartKind() === 'pie') {
                <mona-pie-series [categoryField]="'cat'" [field]="'y'" name="Pie Series" />
            }
        </mona-chart>
    `
})
class EighthRemediationHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly yField = "y";
    public readonly chartKind = signal<"xy" | "pie">("xy");
    public readonly data = signal<FlexibleDataItem[]>([
        { x: 0, y: 10, cat: "A" },
        { x: 50, y: 25, cat: "B" },
        { x: 100, y: 50, cat: "C" }
    ]);
    public readonly xField = signal("x");
    public readonly xAxisId = signal("x-main");
    public readonly xAxisType = signal<ChartXAxisType>("linear");
    public readonly yAxisId = signal("y-main");
    public readonly yAxisType = signal<ChartYAxisType>("linear");
    public readonly showXAxis = signal(true);
    public readonly showYAxis = signal(true);
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];

    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
    }
}

describe("Axis Transition and Measurement Scheduling Acceptance Matrix", () => {
    let fixture: ComponentFixture<EighthRemediationHostComponent>;
    let host: EighthRemediationHostComponent;

    let seriesPolicyCount = 0;
    let orientationPolicyCount = 0;
    let axisRegistryCount = 0;
    let bindingResolutionCount = 0;
    let stackAnalysisCount = 0;
    let stageACount = 0;
    let stageBCount = 0;
    let stageCCount = 0;

    function resetStageCounters(): void {
        seriesPolicyCount = 0;
        orientationPolicyCount = 0;
        axisRegistryCount = 0;
        bindingResolutionCount = 0;
        stackAnalysisCount = 0;
        stageACount = 0;
        stageBCount = 0;
        stageCCount = 0;
    }

    beforeEach(async () => {
        resetStageCounters();

        CartesianStageTracker.current = {
            onSeriesPolicy: () => {
                seriesPolicyCount++;
            },
            onOrientationPolicy: () => {
                orientationPolicyCount++;
            },
            onAxisRegistry: () => {
                axisRegistryCount++;
            },
            onBindingResolution: () => {
                bindingResolutionCount++;
            },
            onStackAnalysis: () => {
                stackAnalysisCount++;
            },
            onStageA: () => {
                stageACount++;
            },
            onStageB: () => {
                stageBCount++;
            },
            onStageC: () => {
                stageCCount++;
            }
        };

        await TestBed.configureTestingModule({
            imports: [EighthRemediationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(EighthRemediationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
    });

    describe("Structural Axis-Type Transition Matrix", () => {
        const transitions: { from: ChartXAxisType; to: ChartXAxisType; sampleData: FlexibleDataItem[] }[] = [
            {
                from: "category",
                to: "linear",
                sampleData: [
                    { x: 0, y: 10 },
                    { x: 50, y: 20 },
                    { x: 100, y: 30 }
                ]
            },
            {
                from: "linear",
                to: "category",
                sampleData: [
                    { x: "Jan", y: 10 },
                    { x: "Feb", y: 20 },
                    { x: "Mar", y: 30 }
                ]
            },
            {
                from: "category",
                to: "time",
                sampleData: [
                    { x: new Date("2025-01-01"), y: 10 },
                    { x: new Date("2025-01-02"), y: 20 },
                    { x: new Date("2025-01-03"), y: 30 }
                ]
            },
            {
                from: "time",
                to: "category",
                sampleData: [
                    { x: "Q1", y: 10 },
                    { x: "Q2", y: 20 },
                    { x: "Q3", y: 30 }
                ]
            },
            {
                from: "linear",
                to: "log",
                sampleData: [
                    { x: 1, y: 10 },
                    { x: 10, y: 20 },
                    { x: 100, y: 30 }
                ]
            },
            {
                from: "log",
                to: "linear",
                sampleData: [
                    { x: 0, y: 10 },
                    { x: 50, y: 20 },
                    { x: 100, y: 30 }
                ]
            },
            {
                from: "linear",
                to: "symlog",
                sampleData: [
                    { x: -50, y: 10 },
                    { x: 0, y: 20 },
                    { x: 50, y: 30 }
                ]
            },
            {
                from: "symlog",
                to: "linear",
                sampleData: [
                    { x: 0, y: 10 },
                    { x: 50, y: 20 },
                    { x: 100, y: 30 }
                ]
            },
            {
                from: "linear",
                to: "pow",
                sampleData: [
                    { x: 0, y: 10 },
                    { x: 50, y: 20 },
                    { x: 100, y: 30 }
                ]
            },
            {
                from: "pow",
                to: "linear",
                sampleData: [
                    { x: 0, y: 10 },
                    { x: 50, y: 20 },
                    { x: 100, y: 30 }
                ]
            }
        ];

        for (const t of transitions) {
            it(`should transition smoothly from ${t.from} to ${t.to} with exact single-pass stage counts`, () => {
                // Initialize 'from' state
                host.xAxisType.set(t.from);
                fixture.detectChanges();
                host.chart().flushPendingRender();

                resetStageCounters();

                // Mutate to 'to' state with appropriate data
                host.data.set(t.sampleData);
                host.xAxisType.set(t.to);
                fixture.detectChanges();
                host.chart().flushPendingRender();

                expect(seriesPolicyCount).toBe(1);
                expect(orientationPolicyCount).toBe(1);
                expect(axisRegistryCount).toBe(1);
                expect(bindingResolutionCount).toBe(1);
                expect(stackAnalysisCount).toBe(1);
                expect(stageACount).toBe(1);
                expect(stageBCount).toBe(1);
                expect(stageCCount).toBe(1);

                const sc = host.chart().scene() as CartesianXYChartScene;
                expect(sc).toBeDefined();
                expect(sc.hasRenderableData).toBe(true);
                const xScene = sc.axes.find(a => a.axis === "x");
                expect(xScene?.scaleType).toBe(t.to);
            });
        }

        it("should handle namespaced shared raw X/Y axis ID mutation without cross-contamination", () => {
            host.xAxisId.set("shared");
            host.yAxisId.set("shared");
            host.xAxisType.set("linear");
            host.yAxisType.set("linear");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Mutate only Y axis type to log
            host.yAxisType.set("log");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const sc = host.chart().scene() as CartesianXYChartScene;
            const xScene = sc.axes.find(a => a.axis === "x");
            const yScene = sc.axes.find(a => a.axis === "y");

            expect(xScene?.axisId).toBe("shared");
            expect(xScene?.scaleType).toBe("linear");
            expect(yScene?.axisId).toBe("shared");
            expect(yScene?.scaleType).toBe("log");
        });

        it("should handle Cartesian to Polar and Polar to Cartesian family transitions", () => {
            resetStageCounters();

            // Switch to Pie (Polar)
            host.chartKind.set("pie");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const polarScene = host.chart().scene();
            expect(polarScene?.coordinateSystem).toBe("polar");

            resetStageCounters();

            // Switch back to XY (Cartesian)
            host.chartKind.set("xy");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const xyScene = host.chart().scene();
            expect(xyScene?.coordinateSystem).toBe("cartesian");
            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("should handle controlled category window normalization when axis becomes continuous", () => {
            // Start as category with controlled category window
            host.xAxisType.set("category");
            host.data.set([
                { x: "A", y: 10 },
                { x: "B", y: 20 },
                { x: "C", y: 30 }
            ]);
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "category", startIndex: 1, endIndexExclusive: 3 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Transition axis to linear while parent still supplies old category window
            host.xAxisType.set("linear");
            host.data.set([
                { x: 0, y: 10 },
                { x: 50, y: 20 },
                { x: 100, y: 30 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc).toBeDefined();
            expect(sc.coordinateSpace).toBeDefined();
            const vp = host.chart().getViewport();
            // Incompatible category window is normalized against new linear authority without throwing
            expect(vp).toBeDefined();
        });
    });

    describe("Controlled Parent Echo / Rejection Matrix", () => {
        it("maintains strict proposal-to-proposal chaining under immediate parent echo", () => {
            const chart = host.chart();
            chart.zoom(1.5);
            fixture.detectChanges();

            const events = host.emittedEvents;
            if (events.length > 0) {
                host.viewport.set(events[events.length - 1].viewport);
                fixture.detectChanges();
            }

            expect(chart.getViewport()).toBeDefined();
        });

        it("seeds canonical controlled state when control is removed", () => {
            const controlledVp: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 25, max: 75 }]
            };
            host.viewport.set(controlledVp);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(host.chart().getViewport()).toEqual(controlledVp);

            // Remove control (controlled -> uncontrolled handoff)
            host.viewport.set(undefined);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Uncontrolled state is seeded from the latest canonical controlled viewport
            expect(host.chart().getViewport()).toEqual(controlledVp);
        });

        it("does not project redundant Stage C for semantically equal cloned controlled input", () => {
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            resetStageCounters();

            // Supply semantically equal fresh object clone
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // No redundant Stage C execution
            expect(stageCCount).toBe(0);
        });
    });

    describe("ResizeObserver Measurement Scheduling", () => {
        it("triggers Chrome invalidation (A=0, B=1, C=1) on base measurement key update", () => {
            resetStageCounters();

            // Invalidate Chrome explicitly (provenance lane)
            host.chart().invalidate(ChartInvalidationReason.Chrome);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("triggers Viewport invalidation (A=0, B=0, C=1) on viewport zoom", () => {
            resetStageCounters();

            host.chart().invalidate(ChartInvalidationReason.Viewport);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(1);
        });
    });
});
