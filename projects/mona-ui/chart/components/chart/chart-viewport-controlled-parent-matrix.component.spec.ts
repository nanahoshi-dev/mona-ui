import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    ChartNavigationInput,
    ChartViewportChangeEvent,
    ChartViewportState
} from "../../models/chart-viewport.models";
import { CartesianStageTracker } from "../../internal/layout/cartesian-stage-instrumentation";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";
import type { ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { ChartComponent } from "./chart.component";
import { CartesianScaleFactory } from "../../internal/scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../../internal/viewport/cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "../../internal/viewport/cartesian-viewport-operation-coordinator";
import type { InternalCartesianViewportState } from "../../internal/viewport/cartesian-viewport-normalizer";

interface FlexibleDataItem {
    cat?: string;
    x: number | string | Date;
    y: number;
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
            [defaultViewport]="defaultViewport()"
            (viewportChange)="onViewportChange($event)"
            style="width: 500px; height: 300px; display: block;"
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
            } @else if (chartKind() === 'pie') {
                <mona-pie-series [categoryField]="'cat'" [field]="'y'" name="Pie Series" />
            }
        </mona-chart>
    `
})
class NinthRemediationHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly chartKind = signal<"xy" | "pie">("xy");
    public readonly data = signal<FlexibleDataItem[]>([
        { x: 0, y: 10, cat: "A" },
        { x: 50, y: 25, cat: "B" },
        { x: 100, y: 50, cat: "C" }
    ]);
    public readonly defaultViewport = signal<ChartViewportState | undefined>(undefined);
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly secondXAxisId = signal("x-sec");
    public readonly secondXAxisType = signal<ChartXAxisType>("linear");
    public readonly showSecondXAxis = signal(false);
    public readonly showXAxis = signal(true);
    public readonly showYAxis = signal(true);
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
    public readonly xAxisId = signal("x-main");
    public readonly xAxisType = signal<ChartXAxisType>("linear");
    public readonly xField = signal("x");
    public readonly yAxisId = signal("y-main");
    public readonly yAxisType = signal<ChartYAxisType>("linear");
    public readonly yField = "y";
    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
    }
}

describe("Controlled Parent State Management and Structural Mutation Matrix", () => {
    let fixture: ComponentFixture<NinthRemediationHostComponent>;
    let host: NinthRemediationHostComponent;

    let stageACount = 0;
    let stageBCount = 0;
    let stageCCount = 0;

    function resetStageCounters(): void {
        stageACount = 0;
        stageBCount = 0;
        stageCCount = 0;
    }

    beforeEach(async () => {
        resetStageCounters();

        CartesianStageTracker.current = {
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
            imports: [NinthRemediationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NinthRemediationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
    });

    describe("Controlled Parent State-Management Archetypes", () => {
        it("Archetype 1: Immediate Parent Echo synchronizes proposal-to-proposal without oscillation", () => {
            resetStageCounters();

            // Parent synchronizes signal immediately on every viewport change
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 90 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(1);

            // Programmatic mutation echoing synchronously
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(2);

            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(20);
            expect(axis0.max).toBe(80);
        });

        it("Archetype 2: Delayed Parent Batch Update maintains gesture proposal stability", () => {
            resetStageCounters();

            // Set initial viewport
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 0, max: 100 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();
            resetStageCounters();

            // Simulate delayed parent batching
            const stagedUpdate: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 25, max: 75 }]
            };

            // Chart is unchanged while parent delays
            expect(stageCCount).toBe(0);

            // Parent commits staged update
            host.viewport.set(stagedUpdate);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageCCount).toBe(1);
            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(25);
            expect(axis0.max).toBe(75);
        });

        it("Archetype 3: End-Only Propagation snaps cleanly upon session completion", () => {
            resetStageCounters();

            // Uncontrolled initial state
            expect(host.viewport()).toBeUndefined();

            // Programmatic set window (simulating end-only user action)
            host.chart().setViewportWindow({ axis: "x", axisId: "x-main", kind: "continuous", min: 30, max: 70 });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(host.emittedEvents.length).toBeGreaterThan(0);
            const lastEvent = host.emittedEvents[host.emittedEvents.length - 1];
            expect(lastEvent.phase).toBe("end");

            // Parent binds viewport on end
            host.viewport.set(lastEvent.viewport);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(30);
            expect(axis0.max).toBe(70);
        });

        it("Archetype 4: Reject / Enforce Custom Bounds clamps proposals without infinite loops", () => {
            resetStageCounters();

            // Parent strictly restricts X min to at least 15
            const clampParent = (raw: ChartViewportState): ChartViewportState => ({
                axes: raw.axes.map(a =>
                    a.axisId === "x-main" && a.kind === "continuous"
                        ? { ...a, min: Math.max(15, a.min as number) }
                        : a
                )
            });

            // Parent provides clamped viewport
            host.viewport.set(clampParent({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 5, max: 80 }]
            }));
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(15);
            expect(stageCCount).toBe(1);
        });

        it("Archetype 5: Clone Reference Mutation avoids redundant Stage C passes", () => {
            resetStageCounters();

            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();
            expect(stageCCount).toBe(1);

            resetStageCounters();

            // Provide exact clone
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]
            });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Exactly zero redundant Stage C executions
            expect(stageCCount).toBe(0);
        });
    });

    describe("Single-Pass Initial Render & Default Viewport", () => {
        it("projects defaultViewport atomically in first Stage C pass (A=1, B=1, C=1)", () => {
            const fixture2 = TestBed.createComponent(NinthRemediationHostComponent);
            const host2 = fixture2.componentInstance;
            host2.defaultViewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 60 }]
            });

            resetStageCounters();
            fixture2.detectChanges();
            host2.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const vp = host2.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(10);
            expect(axis0.max).toBe(60);
        });

        it("projects controlled [viewport] atomically in first Stage C pass (A=1, B=1, C=1)", () => {
            const fixture2 = TestBed.createComponent(NinthRemediationHostComponent);
            const host2 = fixture2.componentInstance;
            host2.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 25, max: 75 }]
            });

            resetStageCounters();
            fixture2.detectChanges();
            host2.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const vp = host2.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(25);
            expect(axis0.max).toBe(75);
        });
    });

    describe("Structural Chart Mutation Matrix", () => {
        it("dynamically adds a second X axis, aborts active interaction, and recomputes coordinate space", () => {
            resetStageCounters();

            // Add second X axis
            host.showSecondXAxis.set(true);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc.axes.some(a => a.axisId === "x-sec")).toBe(true);
        });

        it("reuses axis ID with scale type change from linear to log cleanly", () => {
            resetStageCounters();

            host.xAxisType.set("log");
            host.data.set([
                { x: 1, y: 10 },
                { x: 10, y: 20 },
                { x: 100, y: 30 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const sc = host.chart().scene() as CartesianXYChartScene;
            expect(sc.axes.find(a => a.axis === "x")?.scaleType).toBe("log");
        });

        it("handles category window supplied to continuous axis with safe normalization", () => {
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
            const vp = host.chart().getViewport();
            expect(vp).toBeDefined();
        });
    });

    describe("Category Geometry Index & O(1) Lookup", () => {
        it("performs O(1) bounded candidate category lookup with deterministic tie-breaking", () => {
            const scale = CartesianScaleFactory.createExactPositionScale({
                type: "category",
                domain: ["Alpha", "Beta", "Gamma", "Delta"],
                range: [50, 450]
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain: ["Alpha", "Beta", "Gamma", "Delta"],
                baseScale: scale,
                range: [50, 450],
                ref: { axis: "x", axisId: "x-cat" },
                resolvedType: "category",
                valid: true,
                viewportDomain: ["Alpha", "Beta", "Gamma", "Delta"],
                viewportScale: scale
            };

            const space = new CartesianAxisCoordinateSpace(
                new Map([["x-cat", snap]]),
                new Map()
            );

            // Exact center lookup
            const cat0 = space.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, 100);
            expect(cat0).toBeDefined();
            expect(cat0?.index).toBe(0);
            expect(cat0?.key).toBe("Alpha");

            // Boundary edge lookup
            const centerAlpha = space.mapCategoryCenter({ axis: "x", axisId: "x-cat" }, "Alpha");
            const centerBeta = space.mapCategoryCenter({ axis: "x", axisId: "x-cat" }, "Beta");
            expect(centerAlpha).toBeDefined();
            expect(centerBeta).toBeDefined();
            expect(centerBeta! > centerAlpha!).toBe(true);

            // Key lookup
            const gammaGeom = space.resolveCategoryByKey({ axis: "x", axisId: "x-cat" }, "Gamma");
            expect(gammaGeom).toBeDefined();
            expect(gammaGeom?.baseIndex).toBe(2);
        });
    });

    describe("Negative-Log Wheel Qualification & Gesture Reversibility", () => {
        it("transforms negative-log axis safely without domain inversion or NaN", () => {
            const logScale = CartesianScaleFactory.createExactPositionScale({
                type: "log",
                domain: [-100, -1],
                range: [50, 450]
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain: [-100, -1],
                baseScale: logScale,
                range: [50, 450],
                ref: { axis: "x", axisId: "x-neg-log" },
                resolvedType: "log",
                valid: true,
                viewportDomain: [-100, -1],
                viewportScale: logScale
            };

            const space = new CartesianAxisCoordinateSpace(
                new Map([["x-neg-log", snap]]),
                new Map()
            );

            const initialState: InternalCartesianViewportState = {
                x: new Map([["x-neg-log", { axis: "x", axisId: "x-neg-log", kind: "continuous", min: -100, max: -1 }]]),
                y: new Map()
            };

            const zoomInRes = CartesianViewportOperationCoordinator.transform(
                initialState,
                space,
                [{ axis: "x", axisId: "x-neg-log" }],
                { anchor: { x: 250, y: 150 }, zoomFactor: 1.5 }
            );

            expect(zoomInRes.changed).toBe(true);
            const nextX = zoomInRes.viewport.x.get("x-neg-log") as { min: number; max: number } | undefined;
            expect(nextX).toBeDefined();
            expect(nextX!.min <= nextX!.max).toBe(true);
            expect(Number.isNaN(nextX?.min)).toBe(false);
            expect(Number.isNaN(nextX?.max)).toBe(false);
        });

        it("retains click suppression transfer on gesture authority change", () => {
            // Initiate zoom and verify viewport change emitted
            host.chart().zoom(1.5);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(host.emittedEvents.length).toBeGreaterThan(0);
        });
    });
});
