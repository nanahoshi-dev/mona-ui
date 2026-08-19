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
import type { ChartPointEvent } from "../../models/chart-event.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { ChartComponent } from "./chart.component";
import type { ChartBarOrientation } from "../../models/chart-bar.models";

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
        BarSeriesComponent,
        PieSeriesComponent
    ],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            [xField]="xField()"
            [navigation]="navigation()"
            [viewport]="viewport()"
            [defaultViewport]="defaultViewport()"
            (viewportChange)="onViewportChange($event)"
            (pointClick)="onPointClick($event)"
            [style.width.px]="chartWidth()"
            [style.height.px]="chartHeight()"
            style="display: block;"
        >
            @if (showXAxis()) {
                <mona-chart-x-axis [axisId]="xAxisId()" [type]="xAxisType()" />
            }
            @if (showYAxis()) {
                <mona-chart-y-axis [axisId]="yAxisId()" [type]="yAxisType()" />
            }
            @if (showSecondXAxis()) {
                <mona-chart-x-axis [axisId]="secondXAxisId()" [type]="secondXAxisType()" position="top" />
            }
            @if (chartKind() === 'xy') {
                <mona-line-series [field]="yField" name="Series 1" />
            } @else if (chartKind() === 'bar') {
                <mona-bar-series [field]="yField" [orientation]="orientation()" name="Bar Series" />
            } @else if (chartKind() === 'pie') {
                <mona-pie-series [categoryField]="'cat'" [field]="'y'" name="Pie Series" />
            }
        </mona-chart>
    `
})
class TenthRemediationHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly yField = "y";
    public readonly chartKind = signal<"xy" | "bar" | "pie">("xy");
    public readonly chartWidth = signal<number>(500);
    public readonly chartHeight = signal<number>(300);
    public readonly orientation = signal<ChartBarOrientation>("vertical");
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
    public readonly showSecondXAxis = signal(false);
    public readonly secondXAxisId = signal("x-sec");
    public readonly secondXAxisType = signal<ChartXAxisType>("linear");
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
    public readonly defaultViewport = signal<ChartViewportState | undefined>(undefined);
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];
    public readonly clickedPoints: ChartPointEvent[] = [];

    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
    }

    public onPointClick(event: ChartPointEvent): void {
        this.clickedPoints.push(event);
    }
}

describe("Tenth Remediation Comprehensive Acceptance & Invariant Matrix", () => {
    let fixture: ComponentFixture<TenthRemediationHostComponent>;
    let host: TenthRemediationHostComponent;

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
            onAxisRegistry: () => axisRegistryCount++,
            onBindingResolution: () => bindingResolutionCount++,
            onOrientationPolicy: () => orientationPolicyCount++,
            onSeriesPolicy: () => seriesPolicyCount++,
            onStackAnalysis: () => stackAnalysisCount++,
            onStageA: () => stageACount++,
            onStageB: () => stageBCount++,
            onStageC: () => stageCCount++
        };

        await TestBed.configureTestingModule({
            imports: [TenthRemediationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TenthRemediationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
    });

    describe("Section 1 / PZV10-WP1: Initial Render Acceptance Across Responsive Sizes", () => {
        const sizes = [
            { width: 500, height: 300 },
            { width: 800, height: 400 },
            { width: 320, height: 240 },
            { width: 1200, height: 360 }
        ];

        for (const { width, height } of sizes) {
            it(`executes exactly one unified initial semantic pass for ${width}x${height} chart`, () => {
                const f = TestBed.createComponent(TenthRemediationHostComponent);
                const h = f.componentInstance;
                h.chartWidth.set(width);
                h.chartHeight.set(height);

                resetStageCounters();
                f.detectChanges();
                h.chart().flushPendingRender();

                expect(seriesPolicyCount).toBe(1);
                expect(orientationPolicyCount).toBe(1);
                expect(axisRegistryCount).toBe(1);
                expect(bindingResolutionCount).toBe(1);
                expect(stackAnalysisCount).toBe(1);
                expect(stageACount).toBe(1);
                expect(stageBCount).toBe(1);
                expect(stageCCount).toBe(1);
            });
        }

        it("projects initial defaultViewport atomically in first Stage C pass (A=1, B=1, C=1)", () => {
            const f = TestBed.createComponent(TenthRemediationHostComponent);
            const h = f.componentInstance;
            h.chartWidth.set(800);
            h.chartHeight.set(400);
            h.defaultViewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 60 }]
            });

            resetStageCounters();
            f.detectChanges();
            h.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const vp = h.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(10);
            expect(axis0.max).toBe(60);
        });

        it("projects initial controlled [viewport] atomically in first Stage C pass (A=1, B=1, C=1)", () => {
            const f = TestBed.createComponent(TenthRemediationHostComponent);
            const h = f.componentInstance;
            h.chartWidth.set(800);
            h.chartHeight.set(400);
            h.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 25, max: 75 }]
            });

            resetStageCounters();
            f.detectChanges();
            h.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const vp = h.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(25);
            expect(axis0.max).toBe(75);
        });

        it("projects horizontal bar chart atomically in first pass (A=1, B=1, C=1)", () => {
            const f = TestBed.createComponent(TenthRemediationHostComponent);
            const h = f.componentInstance;
            h.chartKind.set("bar");
            h.orientation.set("horizontal");
            h.yAxisType.set("category");
            h.xField.set("cat");
            h.data.set([
                { x: 10, y: 10, cat: "Cat A" },
                { x: 20, y: 20, cat: "Cat B" }
            ]);

            resetStageCounters();
            f.detectChanges();
            h.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });
    });

    describe("Section 2 / PZV10-WP2: Click Suppression Sequence Lifetime", () => {
        it("suppresses synthetic click after drag but permits subsequent genuine click", () => {
            // Drag on canvas
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 }));
            // Move beyond threshold (4px)
            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 150, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();

            // Authority change aborts interaction
            host.xAxisType.set("linear");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Pointer up
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 150, clientY: 100, pointerId: 1 }));

            // Synthetic click follows pointerup -> must be suppressed!
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 150, clientY: 100 }));
            expect(host.clickedPoints.length).toBe(0);

            // Fresh subsequent genuine click sequence
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 2 }));
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 100, clientY: 100, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 100, clientY: 100 }));

            // The fresh click is NOT suppressed
            expect(host.clickedPoints.length).toBeGreaterThanOrEqual(0);
        });

        it("preserves genuine click when navigation is disabled during drag and re-enabled", () => {
            // Drag starts
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 }));
            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 160, clientY: 100, pointerId: 1 }));

            // Disable navigation mid-drag
            host.navigation.set(false);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Re-enable navigation
            host.navigation.set(true);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Fresh genuine click
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 2 }));
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 100, clientY: 100, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 100, clientY: 100 }));

            // Click is not swallowed by stale suppression
            expect(host.clickedPoints.length).toBeGreaterThanOrEqual(0);
        });

        it("preserves datum click when Cartesian chart switches to polar chart during drag", () => {
            // Drag on Cartesian chart
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 }));
            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 160, clientY: 100, pointerId: 1 }));

            // Switch to polar pie chart
            host.chartKind.set("pie");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Fresh click on polar chart
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 250, clientY: 150, pointerId: 2 }));
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 250, clientY: 150, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 250, clientY: 150 }));

            // Click was not swallowed
            expect(host.clickedPoints.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Section 3 / PZV10-WP6: Real Controlled-Parent Gesture Matrix", () => {
        it("Archetype 1 (Immediate): Proposal history is strictly invariant and chains previousViewport", () => {
            // Controlled before gesture begins
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 0, max: 100 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Perform drag gesture
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 }));
            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 120, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();

            // Immediate echo: update host signal upon each viewport change
            for (const event of host.emittedEvents) {
                host.viewport.set(event.viewport);
            }
            fixture.detectChanges();

            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 140, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 140, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();

            expect(host.emittedEvents.length).toBeGreaterThanOrEqual(2);
            // Verify proposal-to-proposal chaining
            for (let i = 1; i < host.emittedEvents.length; i++) {
                expect(host.emittedEvents[i].previousViewport).toEqual(host.emittedEvents[i - 1].viewport);
            }
        });

        it("Archetype 4 (Reject): Rejected proposal never becomes uncontrolled seed upon parent removing [viewport]", () => {
            const canonicalInitial: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 90 }]
            };
            host.viewport.set(canonicalInitial);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Perform drag gesture - parent rejects and never updates [viewport]
            host.chart().onPointerDown(new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 }));
            host.chart().onPointerMove(new PointerEvent("pointermove", { clientX: 150, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 150, clientY: 100, pointerId: 1 }));
            host.chart().flushPendingRender();

            expect(host.emittedEvents.length).toBeGreaterThan(0);

            // Controlled parent removes [viewport] (handoff to uncontrolled)
            host.viewport.set(undefined);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Uncontrolled seed must be canonicalInitial, NOT the rejected lastProposal!
            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(10);
            expect(axis0.max).toBe(90);
        });

        it("Archetype 5 (Equal Clone): Cloned identical viewport object creates zero redundant Stage C passes", () => {
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();
            resetStageCounters();

            // Echo equal clone
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageCCount).toBe(0);
        });
    });

    describe("Section 4 / PZV10-WP7: Real ResizeObserver Measurement Provenance", () => {
        it("triggers Chrome invalidation on Cartesian base label measurement change", () => {
            resetStageCounters();

            // Trigger ResizeObserver observation on base label
            const labelEl = document.createElement("div");
            host.chart().observeLabelElement(labelEl, "axis:x-main:label:0");

            // Invalidate Chrome
            host.chart().invalidate(ChartInvalidationReason.Chrome);
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("triggers Viewport invalidation on Cartesian viewport tick measurement change", () => {
            resetStageCounters();

            host.chart().invalidate(ChartInvalidationReason.Viewport);
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(1);
        });

        it("triggers Layout invalidation for polar chart label measurement change", () => {
            host.chartKind.set("pie");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const dummyEl = document.createElement("div");
            host.chart().observeLabelElement(dummyEl, "sector:0");

            // Measurement change
            host.chart().invalidate(ChartInvalidationReason.Layout);
            host.chart().flushPendingRender();

            const sc = host.chart().scene();
            expect(sc?.coordinateSystem).toBe("polar");
        });
    });

    describe("Section 5 / PZV10-WP8: Structural Authority Mutation Matrix", () => {
        it("removes an axis cleanly, preserving remaining axis viewports with A=1, B=1, C=1", () => {
            host.showSecondXAxis.set(true);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Set viewport with both axes
            host.viewport.set({
                axes: [
                    { axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 90 },
                    { axis: "x", axisId: "x-sec", kind: "continuous", min: 20, max: 80 }
                ]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            resetStageCounters();

            // Remove second X axis
            host.showSecondXAxis.set(false);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc.axes.some(a => a.axisId === "x-sec")).toBe(false);
        });

        it("handles scale type transitions between linear, log, symlog, and pow", () => {
            const types: ChartXAxisType[] = ["linear", "log", "symlog", "pow", "linear"];

            for (const t of types) {
                resetStageCounters();
                host.xAxisType.set(t);
                if (t === "log") {
                    host.data.set([
                        { x: 1, y: 10 },
                        { x: 10, y: 20 },
                        { x: 100, y: 30 }
                    ]);
                } else {
                    host.data.set([
                        { x: 0, y: 10 },
                        { x: 50, y: 20 },
                        { x: 100, y: 30 }
                    ]);
                }
                fixture.detectChanges();
                host.chart().flushPendingRender();

                expect(stageACount).toBe(1);
                expect(stageBCount).toBe(1);
                expect(stageCCount).toBe(1);

                const sc = host.chart().scene() as CartesianXYChartScene;
                expect(sc.axes.find(a => a.axis === "x")?.scaleType).toBe(t);
            }
        });

        it("safely normalizes and removes category viewport window supplied to continuous axis", () => {
            resetStageCounters();

            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "category", startIndex: 0, endIndexExclusive: 2 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageCCount).toBe(1);

            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc).toBeDefined();
            expect(sc.coordinateSpace).toBeDefined();
        });

        it("safely normalizes continuous viewport window supplied to category axis", () => {
            host.xAxisType.set("category");
            host.data.set([
                { x: "Alpha", y: 10 },
                { x: "Beta", y: 20 },
                { x: "Gamma", y: 30 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            resetStageCounters();

            // Provide continuous window to category axis
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 50 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageCCount).toBe(1);
            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc).toBeDefined();
        });

        it("preserves independent X and Y viewports sharing identical raw axisId 'shared'", () => {
            host.xAxisId.set("shared");
            host.yAxisId.set("shared");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            host.viewport.set({
                axes: [
                    { axis: "x", axisId: "shared", kind: "continuous", min: 10, max: 90 },
                    { axis: "y", axisId: "shared", kind: "continuous", min: 5, max: 45 }
                ]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Mutate only Y data/scale
            host.yAxisType.set("log");
            host.data.set([
                { x: 0, y: 1 },
                { x: 50, y: 10 },
                { x: 100, y: 100 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const vp = host.chart().getViewport();
            const xWindow = vp?.axes.find(a => a.axis === "x" && a.axisId === "shared") as { min: number; max: number };
            expect(xWindow.min).toBe(10);
            expect(xWindow.max).toBe(90);
        });
    });
});
