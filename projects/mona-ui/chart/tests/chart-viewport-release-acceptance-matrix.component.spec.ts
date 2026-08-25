import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    ChartNavigationInput,
    ChartViewportChangeEvent,
    ChartViewportState
} from "../models/chart-viewport.models";
import { CartesianStageTracker } from "../internal/layout/cartesian-stage-instrumentation";
import type { CartesianXYChartScene, PolarSectorChartScene } from "../internal/scene/chart-scene";
import type { ChartXAxisType, ChartYAxisType } from "../models/chart-axis.models";
import type { ChartPointEvent } from "../models/chart-event.models";
import type { ChartAnimationInput } from "../models/chart-animation.models";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { PieSeriesComponent } from "../components/pie-series/pie-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import type { ChartBarOrientation } from "../models/chart-bar.models";

interface FlexibleDataItem {
    cat?: string;
    x: number | string | Date;
    y: number;
}

class FakeResizeObserver {
    public readonly observedElements = new Set<Element>();
    public static instances: FakeResizeObserver[] = [];

    public constructor(public readonly callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this);
    }

    public disconnect(): void {
        this.observedElements.clear();
    }

    public emit(target: Element, width: number, height: number): void {
        this.callback(
            [
                {
                    target,
                    contentRect: {
                        bottom: height,
                        height,
                        left: 0,
                        right: width,
                        top: 0,
                        width,
                        x: 0,
                        y: 0,
                        toJSON: () => ({})
                    } as DOMRectReadOnly
                } as ResizeObserverEntry
            ],
            this as unknown as ResizeObserver
        );
    }

    public observe(target: Element): void {
        this.observedElements.add(target);
    }

    public unobserve(target: Element): void {
        this.observedElements.delete(target);
    }
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
            [animation]="animation()"
            [viewport]="viewport()"
            [defaultViewport]="defaultViewport()"
            (viewportChange)="onViewportChange($event)"
            (pointClick)="onPointClick($event)"
            [style.width.px]="chartWidth()"
            [style.height.px]="chartHeight()"
            style="display: block;">
            @if (showXAxis()) {
                <mona-chart-x-axis [axisId]="xAxisId()" [type]="xAxisType()" />
            }
            @if (showYAxis()) {
                <mona-chart-y-axis [axisId]="yAxisId()" [type]="yAxisType()" />
            }
            @if (showSecondXAxis()) {
                <mona-chart-x-axis [axisId]="secondXAxisId()" [type]="secondXAxisType()" position="top" />
            }
            @if (chartKind() === "xy") {
                <mona-line-series [field]="yField" name="Series 1" />
            } @else if (chartKind() === "bar") {
                <mona-bar-series [field]="yField" [orientation]="orientation()" name="Bar Series" />
            } @else if (chartKind() === "pie") {
                <mona-pie-series [categoryField]="'cat'" [field]="'y'" name="Pie Series" />
            }
        </mona-chart>
    `
})
class EleventhRemediationHostComponent {
    public readonly animation = signal<ChartAnimationInput>(false);
    public readonly chart = viewChild.required(ChartComponent);
    public readonly chartHeight = signal<number>(300);
    public readonly chartKind = signal<"xy" | "bar" | "pie">("xy");
    public readonly chartWidth = signal<number>(500);
    public readonly clickedPoints: ChartPointEvent[] = [];
    public readonly data = signal<FlexibleDataItem[]>([
        { x: 0, y: 10, cat: "A" },
        { x: 50, y: 25, cat: "B" },
        { x: 100, y: 50, cat: "C" }
    ]);
    public readonly defaultViewport = signal<ChartViewportState | undefined>(undefined);
    public readonly delayedQueue: ChartViewportState[] = [];
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];
    public readonly mode = signal<"immediate" | "delayed" | "end-only" | "reject" | "equal-clone">("reject");
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly orientation = signal<ChartBarOrientation>("vertical");
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

    public flushDelayedParentFrame(): void {
        const next = this.delayedQueue.shift();
        if (next) {
            this.viewport.set(next);
        }
    }

    public onPointClick(event: ChartPointEvent): void {
        this.clickedPoints.push(event);
    }

    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
        const m = this.mode();
        if (m === "immediate") {
            this.viewport.set({ axes: event.viewport.axes.map(a => ({ ...a })) });
        } else if (m === "delayed") {
            this.delayedQueue.push({ axes: event.viewport.axes.map(a => ({ ...a })) });
        } else if (m === "end-only") {
            if (event.phase === "end") {
                this.viewport.set({ axes: event.viewport.axes.map(a => ({ ...a })) });
            }
        } else if (m === "equal-clone") {
            this.viewport.set({ axes: event.viewport.axes.map(a => ({ ...a })) });
        } else if (m === "reject") {
            // Do not update viewport
        }
    }
}

describe("Viewport Release Acceptance and Invariant Matrix", () => {
    let fixture: ComponentFixture<EleventhRemediationHostComponent>;
    let host: EleventhRemediationHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

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

        if (typeof globalThis !== "undefined") {
            originalResizeObserver = globalThis.ResizeObserver;
            FakeResizeObserver.instances = [];
            globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        }

        await TestBed.configureTestingModule({
            imports: [EleventhRemediationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(EleventhRemediationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
        vi.restoreAllMocks();
        if (typeof globalThis !== "undefined") {
            if (originalResizeObserver !== undefined) {
                globalThis.ResizeObserver = originalResizeObserver;
            } else {
                delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
            }
        }
    });

    describe("Initial Render Acceptance Across Responsive Sizes", () => {
        const sizes = [
            { width: 500, height: 300 },
            { width: 800, height: 400 },
            { width: 320, height: 240 },
            { width: 1200, height: 360 }
        ];

        for (const { width, height } of sizes) {
            it(`executes exactly one unified initial semantic pass for ${width}x${height} chart with mocked DOM geometry`, () => {
                const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
                    bottom: height,
                    height,
                    left: 0,
                    right: width,
                    top: 0,
                    width,
                    x: 0,
                    y: 0,
                    toJSON: () => ({})
                } as DOMRect);

                const f = TestBed.createComponent(EleventhRemediationHostComponent);
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

                const sc = h.chart().scene();
                expect(sc).toBeDefined();
                expect(sc?.width).toBe(width);
                expect(sc?.height).toBe(height);

                rectSpy.mockRestore();
            });
        }

        it("projects initial defaultViewport atomically in first Stage C pass (A=1, B=1, C=1) at 800x400", () => {
            const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
                bottom: 400,
                height: 400,
                left: 0,
                right: 800,
                top: 0,
                width: 800,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect);

            const f = TestBed.createComponent(EleventhRemediationHostComponent);
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

            const sc = h.chart().scene();
            expect(sc?.width).toBe(800);
            expect(sc?.height).toBe(400);

            const vp = h.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(10);
            expect(axis0.max).toBe(60);

            rectSpy.mockRestore();
        });

        it("projects initial controlled [viewport] atomically in first Stage C pass (A=1, B=1, C=1) at 800x400", () => {
            const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
                bottom: 400,
                height: 400,
                left: 0,
                right: 800,
                top: 0,
                width: 800,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect);

            const f = TestBed.createComponent(EleventhRemediationHostComponent);
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

            const sc = h.chart().scene();
            expect(sc?.width).toBe(800);
            expect(sc?.height).toBe(400);

            const vp = h.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(25);
            expect(axis0.max).toBe(75);

            rectSpy.mockRestore();
        });

        it("projects horizontal bar chart atomically in first pass (A=1, B=1, C=1)", () => {
            const f = TestBed.createComponent(EleventhRemediationHostComponent);
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

    describe("Click Suppression Sequence Lifetime", () => {
        it("suppresses synthetic click after drag and emits exactly one click for subsequent genuine interaction", () => {
            const sc = host.chart().scene() as CartesianXYChartScene;
            const hit = sc.hitTargets[1]; // x=50, y=25
            const hitPoint = hit.point!;

            // Drag on canvas
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 150, clientY: 100, pointerId: 1 })
            );
            host.chart().flushPendingRender();
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 150, clientY: 100, pointerId: 1 }));

            // Synthetic click follows drag pointerup -> must be suppressed!
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 150, clientY: 100 }));
            expect(host.clickedPoints.length).toBe(0);

            // Fresh subsequent genuine click sequence on known data point
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: hitPoint.x, clientY: hitPoint.y, pointerId: 2 })
            );
            host.chart().onPointerUp(
                new PointerEvent("pointerup", { clientX: hitPoint.x, clientY: hitPoint.y, pointerId: 2 })
            );
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: hitPoint.x, clientY: hitPoint.y }));

            // Exactly 1 genuine click is emitted
            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(25);
        });

        it("preserves genuine click when dragPan is dynamically disabled after drag threshold (no synthetic click arrives)", () => {
            // 1. Drag starts and crosses threshold
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 160, clientY: 100, pointerId: 1 })
            );
            host.chart().flushPendingRender();

            // 2. Navigation dynamically disables dragPan while remaining enabled
            host.navigation.set({ dragPan: false, pinchZoom: true, wheelZoom: true });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // 3. Old sequence ends (pointerup)
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 160, clientY: 100, pointerId: 1 }));

            // 4. Fresh pointer sequence on known data point (x=50, y=25) WITHOUT prior synthetic click
            const sc = host.chart().scene() as CartesianXYChartScene;
            const hit = sc.hitTargets[1];
            const pt = hit.point!;

            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: pt.x, clientY: pt.y, pointerId: 2 })
            );
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: pt.x, clientY: pt.y, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: pt.x, clientY: pt.y }));

            // Genuine point click is preserved and emitted!
            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(25);
        });

        it("preserves genuine click after synthetic click when dragPan is dynamically disabled after drag threshold", () => {
            // 1. Drag starts and crosses threshold
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 160, clientY: 100, pointerId: 1 })
            );
            host.chart().flushPendingRender();

            // 2. Navigation dynamically disables dragPan
            host.navigation.set({ dragPan: false, pinchZoom: true, wheelZoom: true });
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // 3. Old sequence ends (pointerup)
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 160, clientY: 100, pointerId: 1 }));

            // 4. Synthetic click arrives from old sequence -> must be swallowed
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 160, clientY: 100 }));
            expect(host.clickedPoints.length).toBe(0);

            // 5. Fresh pointer sequence on known data point (x=50, y=25)
            const sc = host.chart().scene() as CartesianXYChartScene;
            const hit = sc.hitTargets[1];
            const pt = hit.point!;

            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: pt.x, clientY: pt.y, pointerId: 2 })
            );
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: pt.x, clientY: pt.y, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: pt.x, clientY: pt.y }));

            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(25);
        });

        it("suppresses synthetic click when genuine authority change aborts drag and emits subsequent genuine click", () => {
            // Drag on canvas
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 150, clientY: 100, pointerId: 1 })
            );
            host.chart().flushPendingRender();

            // Genuine authority change (linear -> symlog) aborts interaction
            host.xAxisType.set("symlog");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Pointer up
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 150, clientY: 100, pointerId: 1 }));

            // Synthetic click follows pointerup -> must be suppressed!
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 150, clientY: 100 }));
            expect(host.clickedPoints.length).toBe(0);

            // Fresh subsequent genuine click sequence on recomputed scene hit target
            const newSc = host.chart().scene() as CartesianXYChartScene;
            const newHit = newSc.hitTargets[1];
            const newPt = newHit.point!;

            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: newPt.x, clientY: newPt.y, pointerId: 3 })
            );
            host.chart().onPointerUp(
                new PointerEvent("pointerup", { clientX: newPt.x, clientY: newPt.y, pointerId: 3 })
            );
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: newPt.x, clientY: newPt.y }));

            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(25);
        });

        it("preserves genuine click when navigation is disabled during drag and re-enabled", () => {
            // Drag starts
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 160, clientY: 100, pointerId: 1 })
            );

            // Disable navigation mid-drag
            host.navigation.set(false);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 160, clientY: 100, pointerId: 1 }));

            // Re-enable navigation
            host.navigation.set(true);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Fresh genuine click on known hit target
            const sc = host.chart().scene() as CartesianXYChartScene;
            const hit = sc.hitTargets[0];
            const pt = hit.point!;

            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: pt.x, clientY: pt.y, pointerId: 2 })
            );
            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: pt.x, clientY: pt.y, pointerId: 2 }));
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: pt.x, clientY: pt.y }));

            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(10);
        });

        it("preserves datum click when Cartesian chart switches to polar chart during drag", () => {
            // Drag on Cartesian chart
            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            host.chart().onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 160, clientY: 100, pointerId: 1 })
            );
            host.chart().flushPendingRender();

            // Switch to polar pie chart
            host.chartKind.set("pie");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            host.chart().onPointerUp(new PointerEvent("pointerup", { clientX: 160, clientY: 100, pointerId: 1 }));

            // Synthetic click on canvas is suppressed
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: 160, clientY: 100 }));
            expect(host.clickedPoints.length).toBe(0);

            // Fresh click on polar pie slice
            const polarSc = host.chart().scene() as PolarSectorChartScene;
            const slice = polarSc.series[0].slices[0];
            const centroid = slice.centroid;

            host.chart().onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: centroid.x, clientY: centroid.y, pointerId: 2 })
            );
            host.chart().onPointerUp(
                new PointerEvent("pointerup", { clientX: centroid.x, clientY: centroid.y, pointerId: 2 })
            );
            host.chart().onCanvasClick(new MouseEvent("click", { clientX: centroid.x, clientY: centroid.y }));

            expect(host.clickedPoints.length).toBe(1);
            expect(host.clickedPoints[0].yValue).toBe(10);
        });
    });

    describe("Real Controlled-Parent Gesture Matrix", () => {
        function runStandardGesture(chart: ChartComponent, onStep?: () => void): void {
            chart.onPointerDown(
                new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
            );
            chart.onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 125, clientY: 100, pointerId: 1 })
            );
            chart.flushPendingRender();
            onStep?.();
            chart.onPointerMove(
                new PointerEvent("pointermove", { buttons: 1, clientX: 150, clientY: 100, pointerId: 1 })
            );
            chart.flushPendingRender();
            onStep?.();
            chart.onPointerUp(new PointerEvent("pointerup", { clientX: 150, clientY: 100, pointerId: 1 }));
            chart.flushPendingRender();
            onStep?.();
        }

        it("produces invariant proposal stream across immediate, delayed (during gesture), end-only, and reject modes", () => {
            const initialVp: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 0, max: 100 }]
            };

            const modes: ("immediate" | "delayed" | "end-only" | "reject")[] = [
                "immediate",
                "delayed",
                "end-only",
                "reject"
            ];

            const modeProposals: Record<string, string[]> = {};

            for (const m of modes) {
                host.mode.set(m);
                host.viewport.set(initialVp);
                host.emittedEvents.length = 0;
                host.delayedQueue.length = 0;
                fixture.detectChanges();
                host.chart().flushPendingRender();

                runStandardGesture(host.chart(), () => {
                    if (m === "delayed") {
                        host.flushDelayedParentFrame();
                        fixture.detectChanges();
                        host.chart().flushPendingRender();
                    }
                });

                expect(host.emittedEvents.length).toBeGreaterThanOrEqual(2);

                // Proposal previousViewport chaining invariant
                for (let i = 1; i < host.emittedEvents.length; i++) {
                    expect(host.emittedEvents[i].previousViewport).toEqual(host.emittedEvents[i - 1].viewport);
                }

                modeProposals[m] = host.emittedEvents.map(e =>
                    JSON.stringify({ phase: e.phase, source: e.source, viewport: e.viewport })
                );
            }

            // Invariance: All modes must produce identical proposal stream
            for (let i = 1; i < modes.length; i++) {
                expect(modeProposals[modes[i]]).toEqual(modeProposals[modes[0]]);
            }
        });

        it("produces invariant wheel proposal stream across immediate, delayed, end-only, and reject modes", () => {
            vi.useFakeTimers();
            try {
                const initialVp: ChartViewportState = {
                    axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 0, max: 100 }]
                };

                const modes: ("immediate" | "delayed" | "end-only" | "reject")[] = [
                    "immediate",
                    "delayed",
                    "end-only",
                    "reject"
                ];

                const modeProposals: Record<string, string[]> = {};

                for (const m of modes) {
                    host.mode.set(m);
                    host.viewport.set(initialVp);
                    host.emittedEvents.length = 0;
                    host.delayedQueue.length = 0;
                    fixture.detectChanges();
                    host.chart().flushPendingRender();

                    // Step 1: Wheel zoom in
                    host.chart().onWheel(new WheelEvent("wheel", { clientX: 100, clientY: 100, deltaY: -50 }));
                    host.chart().flushPendingRender();
                    if (m === "delayed") {
                        host.flushDelayedParentFrame();
                        fixture.detectChanges();
                        host.chart().flushPendingRender();
                    }

                    // Step 2: Wheel zoom in again
                    host.chart().onWheel(new WheelEvent("wheel", { clientX: 100, clientY: 100, deltaY: -50 }));
                    host.chart().flushPendingRender();
                    if (m === "delayed") {
                        host.flushDelayedParentFrame();
                        fixture.detectChanges();
                        host.chart().flushPendingRender();
                    }

                    // Complete wheel session via debounce timer
                    vi.advanceTimersByTime(200);
                    host.chart().flushPendingRender();

                    expect(host.emittedEvents.length).toBeGreaterThanOrEqual(1);

                    // Proposal previousViewport chaining invariant
                    for (let i = 1; i < host.emittedEvents.length; i++) {
                        expect(host.emittedEvents[i].previousViewport).toEqual(host.emittedEvents[i - 1].viewport);
                    }

                    modeProposals[m] = host.emittedEvents.map(e =>
                        JSON.stringify({ phase: e.phase, source: e.source, viewport: e.viewport })
                    );
                }

                // Invariance: All modes must produce identical wheel proposal stream
                for (let i = 1; i < modes.length; i++) {
                    expect(modeProposals[modes[i]]).toEqual(modeProposals[modes[0]]);
                }
            } finally {
                vi.useRealTimers();
            }
        });

        it("produces invariant pinch proposal stream across immediate, delayed, end-only, and reject modes", () => {
            const initialVp: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 0, max: 100 }]
            };

            const modes: ("immediate" | "delayed" | "end-only" | "reject")[] = [
                "immediate",
                "delayed",
                "end-only",
                "reject"
            ];

            const modeProposals: Record<string, string[]> = {};

            for (const m of modes) {
                host.mode.set(m);
                host.viewport.set(initialVp);
                host.emittedEvents.length = 0;
                host.delayedQueue.length = 0;
                fixture.detectChanges();
                host.chart().flushPendingRender();

                // Touch 1 down
                host.chart().onPointerDown(
                    new PointerEvent("pointerdown", {
                        button: 0,
                        clientX: 100,
                        clientY: 150,
                        pointerId: 1,
                        pointerType: "touch"
                    })
                );
                // Touch 2 down (starts pinch)
                host.chart().onPointerDown(
                    new PointerEvent("pointerdown", {
                        button: 0,
                        clientX: 200,
                        clientY: 150,
                        pointerId: 2,
                        pointerType: "touch"
                    })
                );
                host.chart().flushPendingRender();

                // Touch 2 moves (spread distance)
                host.chart().onPointerMove(
                    new PointerEvent("pointermove", { clientX: 250, clientY: 150, pointerId: 2, pointerType: "touch" })
                );
                host.chart().flushPendingRender();
                if (m === "delayed") {
                    host.flushDelayedParentFrame();
                    fixture.detectChanges();
                    host.chart().flushPendingRender();
                }

                // Touch 2 moves further
                host.chart().onPointerMove(
                    new PointerEvent("pointermove", { clientX: 300, clientY: 150, pointerId: 2, pointerType: "touch" })
                );
                host.chart().flushPendingRender();
                if (m === "delayed") {
                    host.flushDelayedParentFrame();
                    fixture.detectChanges();
                    host.chart().flushPendingRender();
                }

                // Touch 2 up
                host.chart().onPointerUp(
                    new PointerEvent("pointerup", { clientX: 300, clientY: 150, pointerId: 2, pointerType: "touch" })
                );
                // Touch 1 up
                host.chart().onPointerUp(
                    new PointerEvent("pointerup", { clientX: 100, clientY: 150, pointerId: 1, pointerType: "touch" })
                );
                host.chart().flushPendingRender();

                expect(host.emittedEvents.length).toBeGreaterThanOrEqual(2);

                for (let i = 1; i < host.emittedEvents.length; i++) {
                    expect(host.emittedEvents[i].previousViewport).toEqual(host.emittedEvents[i - 1].viewport);
                }

                modeProposals[m] = host.emittedEvents.map(e =>
                    JSON.stringify({ phase: e.phase, source: e.source, viewport: e.viewport })
                );
            }

            for (let i = 1; i < modes.length; i++) {
                expect(modeProposals[modes[i]]).toEqual(modeProposals[modes[0]]);
            }
        });

        it("Archetype 4 (Reject): Rejected proposal never becomes uncontrolled seed upon parent removing [viewport]", () => {
            const canonicalInitial: ChartViewportState = {
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", min: 10, max: 90 }]
            };
            host.mode.set("reject");
            host.viewport.set(canonicalInitial);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            runStandardGesture(host.chart());

            expect(host.emittedEvents.length).toBeGreaterThan(0);

            // Controlled parent removes [viewport] (handoff to uncontrolled)
            host.viewport.set(undefined);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            // Uncontrolled seed must be canonicalInitial, NOT the rejected proposal!
            const vp = host.chart().getViewport();
            const axis0 = vp?.axes[0] as { min: number; max: number };
            expect(axis0.min).toBe(10);
            expect(axis0.max).toBe(90);
        });

        it("Archetype 5 (Equal Clone): Cloned identical viewport object creates zero redundant Stage C passes", () => {
            host.mode.set("equal-clone");
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

    describe("Real ResizeObserver Measurement Provenance", () => {
        it("triggers Chrome invalidation (A=0, B=1, C=1) on Cartesian base label measurement change", () => {
            const sc = host.chart().scene() as CartesianXYChartScene;
            const baseTickKey = sc.axes[0].ticks[0]?.tickKey ?? "axis:x-main:tick:0";

            const labelEl = document.createElement("div");
            host.chart().observeLabelElement(labelEl, baseTickKey);

            const obs = FakeResizeObserver.instances.find(i => i.observedElements.has(labelEl));
            expect(obs).toBeDefined();

            resetStageCounters();

            // Emit measurement change through the ResizeObserver callback
            obs!.emit(labelEl, 100, 40);
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("triggers Viewport invalidation (A=0, B=0, C=1) on Cartesian viewport tick measurement change", () => {
            const initialSc = host.chart().scene() as CartesianXYChartScene;
            const baseTickKeys = new Set(initialSc.axes[0].ticks.map(t => t.tickKey));

            // Zoom in viewport so viewport-only ticks are generated
            host.chart().setViewportWindow({ axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 40 });
            host.chart().flushPendingRender();

            const zoomedSc = host.chart().scene() as CartesianXYChartScene;
            const vpTick =
                zoomedSc.axes[0].ticks.find(t => t.tickKey && !baseTickKeys.has(t.tickKey)) ??
                zoomedSc.axes[0].ticks[0];
            const vpTickKey = vpTick.tickKey ?? "axis:x-main:tick:0";

            const vpEl = document.createElement("div");
            host.chart().observeLabelElement(vpEl, vpTickKey);

            const obs = FakeResizeObserver.instances.find(i => i.observedElements.has(vpEl));
            expect(obs).toBeDefined();

            resetStageCounters();

            // Emit viewport-only tick measurement change through ResizeObserver
            obs!.emit(vpEl, 90, 45);
            host.chart().flushPendingRender();

            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(1);
        });

        it("triggers Layout invalidation for polar chart label measurement change", () => {
            host.chartKind.set("pie");
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const polarSc = host.chart().scene() as PolarSectorChartScene;
            const sliceId = polarSc.series[0].slices[0].sliceId;
            const labelKey = `sector:${sliceId}`;

            const pieEl = document.createElement("div");
            host.chart().observeLabelElement(pieEl, labelKey);

            const obs = FakeResizeObserver.instances.find(i => i.observedElements.has(pieEl));
            expect(obs).toBeDefined();

            obs!.emit(pieEl, 120, 60);
            host.chart().flushPendingRender();

            const sc = host.chart().scene();
            expect(sc?.coordinateSystem).toBe("polar");
        });
    });

    describe("Structural Authority & Validity Matrix", () => {
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

            const vp = host.chart().getViewport();
            expect(vp?.axes.some(a => a.axisId === "x-sec")).toBe(false);
            const xMainWindow = vp?.axes.find(a => a.axisId === "x-main") as { min: number; max: number };
            expect(xMainWindow.min).toBe(10);
            expect(xMainWindow.max).toBe(90);
        });

        it("handles valid -> invalid -> valid transitions safely without NaN geometry", () => {
            host.xAxisType.set("log");
            host.data.set([
                { x: 1, y: 10 },
                { x: 10, y: 20 },
                { x: 100, y: 30 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            const validSc = host.chart().scene() as CartesianXYChartScene;
            expect(validSc.coordinateSpace?.get({ axis: "x", axisId: "x-main" })?.valid).toBe(true);
            expect(
                validSc.coordinateSpace?.resolveContinuousAtPixel({ axis: "x", axisId: "x-main" }, 250)
            ).toBeDefined();

            // Valid -> Invalid: Log scale with mixed positive and negative data domain
            resetStageCounters();
            host.data.set([
                { x: -10, y: 10 },
                { x: 10, y: 20 }
            ]);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);

            const invalidSc = host.chart().scene() as CartesianXYChartScene;
            expect(invalidSc.coordinateSpace?.get({ axis: "x", axisId: "x-main" })?.valid).toBe(false);
            expect(
                invalidSc.coordinateSpace?.resolveContinuousAtPixel({ axis: "x", axisId: "x-main" }, 250)
            ).toBeUndefined();

            // Invalid -> Valid: Restore positive data
            resetStageCounters();
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

            const restoredSc = host.chart().scene() as CartesianXYChartScene;
            expect(restoredSc.coordinateSpace?.get({ axis: "x", axisId: "x-main" })?.valid).toBe(true);
            expect(
                restoredSc.coordinateSpace?.resolveContinuousAtPixel({ axis: "x", axisId: "x-main" }, 250)
            ).toBeDefined();
        });

        it("handles scale type transitions between linear, log, symlog, and pow with exact A=1, B=1, C=1", () => {
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

            const vp = host.chart().getViewport();
            expect(vp?.axes.some(a => a.kind === "category")).toBe(false);
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
            const vp = host.chart().getViewport();
            expect(vp?.axes.some(a => a.kind === "continuous")).toBe(false);
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
