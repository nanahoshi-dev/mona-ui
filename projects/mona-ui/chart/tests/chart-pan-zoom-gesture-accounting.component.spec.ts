import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    ChartNavigationInput,
    ChartViewportChangeEvent,
    ChartViewportState
} from "../models/chart-viewport.models";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";
import { CartesianStageTracker } from "../internal/layout/cartesian-stage-instrumentation";
import { ChartViewportGestureController } from "../internal/viewport/chart-viewport-gesture-controller";
import type { CartesianXYChartScene } from "../internal/scene/chart-scene";
import { CartesianScaleFactory } from "../internal/scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace } from "../internal/viewport/cartesian-axis-coordinate-space";
import {
    createEmptyInternalViewportState,
    type InternalCartesianViewportState
} from "../internal/viewport/cartesian-viewport-normalizer";
import { DEFAULT_NAVIGATION_OPTIONS } from "../internal/viewport/chart-navigation-options";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { ChartComponent } from "../components/chart/chart.component";

interface DataItem {
    x: number;
    y: number;
}

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            [xField]="xField()"
            [navigation]="navigation()"
            [viewport]="viewport()"
            (viewportChange)="onViewportChange($event)"
            style="width: 500px; height: 300px; display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series [field]="yField" name="Series 1" />
        </mona-chart>
    `
})
class SeventhRemediationHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal<DataItem[]>([
        { x: 0, y: 10 },
        { x: 50, y: 25 },
        { x: 100, y: 50 }
    ]);
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
    public readonly xField = signal("x");
    public readonly yField = "y";
    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
    }
}

describe("Pan and Zoom Gesture Accounting and Boundary Handling", () => {
    let fixture: ComponentFixture<SeventhRemediationHostComponent>;
    let host: SeventhRemediationHostComponent;

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
            imports: [SeventhRemediationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SeventhRemediationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
    });

    describe("Stage & Upstream Semantic Pass Accounting", () => {
        it("should execute exactly 1 of each semantic pass and Stage A=1, B=1, C=1 on initial creation and render", () => {
            // Evaluates from TestBed initialization
            expect(seriesPolicyCount).toBe(1);
            expect(orientationPolicyCount).toBe(1);
            expect(axisRegistryCount).toBe(1);
            expect(bindingResolutionCount).toBe(1);
            expect(stackAnalysisCount).toBe(1);
            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("should execute exactly 1 of each semantic pass and Stage A=1, B=1, C=1 on structural layout computation", () => {
            resetStageCounters();

            host.chart().recomputeScene(ChartInvalidationReason.Data);

            expect(seriesPolicyCount).toBe(1);
            expect(orientationPolicyCount).toBe(1);
            expect(axisRegistryCount).toBe(1);
            expect(bindingResolutionCount).toBe(1);
            expect(stackAnalysisCount).toBe(1);
            expect(stageACount).toBe(1);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });

        it("should execute 1 of each pass on structural data change", () => {
            resetStageCounters();

            host.data.set([
                { x: 0, y: 20 },
                { x: 50, y: 40 },
                { x: 120, y: 60 }
            ]);
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
        });

        it("should execute 0 semantic passes, Stage A=0, Stage B=0, and Stage C=1 on viewport-only zoom", () => {
            resetStageCounters();

            host.chart().zoom(1.5);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(seriesPolicyCount).toBe(0);
            expect(orientationPolicyCount).toBe(0);
            expect(axisRegistryCount).toBe(0);
            expect(bindingResolutionCount).toBe(0);
            expect(stackAnalysisCount).toBe(0);
            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(0);
            expect(stageCCount).toBe(1);
        });

        it("should execute 0 semantic passes, Stage A=0, Stage B=1, and Stage C=1 on Chrome-only invalidation", () => {
            resetStageCounters();

            host.chart().invalidate(ChartInvalidationReason.Chrome);
            fixture.detectChanges();
            host.chart().flushPendingRender();

            expect(seriesPolicyCount).toBe(0);
            expect(orientationPolicyCount).toBe(0);
            expect(axisRegistryCount).toBe(0);
            expect(bindingResolutionCount).toBe(0);
            expect(stackAnalysisCount).toBe(0);
            expect(stageACount).toBe(0);
            expect(stageBCount).toBe(1);
            expect(stageCCount).toBe(1);
        });
    });

    describe("Gesture Reversibility and Boundary Clamp Deduplication", () => {
        it("should restore initial viewport when drag returns exactly to start point", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            const emitted: ChartViewportChangeEvent[] = [];
            let currentVp = createEmptyInternalViewportState();

            let rafCallback: (() => void) | null = null;
            const mockRequestFrame = (cb: () => void) => {
                rafCallback = cb;
                return 1;
            };
            const mockCancelFrame = () => {
                rafCallback = null;
            };

            const controller = new ChartViewportGestureController(
                {
                    axisScenes: sc.axes,
                    coordinateSpace,
                    currentViewport: currentVp,
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: false,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.0015,
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: () => {},
                    onViewportChange: (next, ev) => {
                        currentVp = next;
                        emitted.push(ev);
                    },
                    orientation: "vertical",
                    plotRect: sc.plotRect
                },
                mockRequestFrame,
                mockCancelFrame
            );

            const startPt = { x: 200, y: 150 };
            const dummyPointerDown = { button: 0, pointerId: 1, target: null } as PointerEvent;

            // Start drag
            controller.handlePointerDown(dummyPointerDown, startPt);

            // Move by +50px (exceeds threshold)
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 250, y: 150 });
            expect(rafCallback).not.toBeNull();
            rafCallback!();

            expect(emitted.length).toBe(2); // start, update
            expect(emitted[0].phase).toBe("start");
            expect(emitted[1].phase).toBe("update");
            expect(emitted[1].viewport.axes.length).toBeGreaterThan(0);

            // Move back to start point (reversibility!)
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, startPt);
            rafCallback!();

            expect(emitted.length).toBe(3);
            expect(emitted[2].phase).toBe("update");
            // Viewport should match initial empty viewport (or full domain)
            expect(emitted[2].viewport.axes.length).toBe(0);

            controller.destroy();
        });

        it("should deduplicate boundary clamp proposals so continuous drag past limit emits 0 extra updates", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            const emitted: ChartViewportChangeEvent[] = [];
            let currentVp = createEmptyInternalViewportState();

            let rafCallback: (() => void) | null = null;
            const mockRequestFrame = (cb: () => void) => {
                rafCallback = cb;
                return 1;
            };

            const controller = new ChartViewportGestureController(
                {
                    axisScenes: sc.axes,
                    coordinateSpace,
                    currentViewport: currentVp,
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: true,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.0015,
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: () => {},
                    onViewportChange: (next, ev) => {
                        currentVp = next;
                        emitted.push(ev);
                    },
                    orientation: "vertical",
                    plotRect: sc.plotRect
                },
                mockRequestFrame,
                () => {}
            );

            // Start drag on a chart that is at data clamp boundary
            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 200, y: 150 });

            // Move +100px past boundary
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 300, y: 150 });
            rafCallback!();

            const countAfterFirstClamp = emitted.length;

            // Move further +200px past boundary
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 500, y: 150 });
            rafCallback!();

            // Move further +300px past boundary
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 800, y: 150 });
            rafCallback!();

            // Zero additional update events after clamp was hit
            expect(emitted.length).toBe(countAfterFirstClamp);

            controller.destroy();
        });

        it("should handle real update -> hit boundary -> continued physical movement with 0 extra updates", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            // Seed with zoomed viewport [20, 80]
            const zoomedXScale = CartesianScaleFactory.createExactPositionScale({
                type: "linear",
                domain: [20, 80],
                range: [sc.plotRect.x, sc.plotRect.x + sc.plotRect.width]
            });
            const zoomedCoordSpace = new CartesianAxisCoordinateSpace(
                new Map([
                    [
                        "x-main",
                        {
                            baseDomain: [0, 100],
                            baseScale: coordinateSpace.get({ axis: "x", axisId: "x-main" })!.baseScale,
                            range: [sc.plotRect.x, sc.plotRect.x + sc.plotRect.width],
                            ref: { axis: "x", axisId: "x-main" },
                            resolvedType: "linear",
                            valid: true,
                            viewportDomain: [20, 80],
                            viewportScale: zoomedXScale
                        }
                    ]
                ]),
                new Map()
            );

            const initialZoomedVp: InternalCartesianViewportState = {
                x: new Map([["x-main", { axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }]]),
                y: new Map()
            };

            const emitted: ChartViewportChangeEvent[] = [];
            let currentVp = initialZoomedVp;

            let rafCallback: (() => void) | null = null;
            const mockRequestFrame = (cb: () => void) => {
                rafCallback = cb;
                return 1;
            };

            const controller = new ChartViewportGestureController(
                {
                    axisScenes: sc.axes,
                    coordinateSpace: zoomedCoordSpace,
                    currentViewport: currentVp,
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: true,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.0015,
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: () => {},
                    onViewportChange: (next, ev) => {
                        currentVp = next;
                        emitted.push(ev);
                    },
                    orientation: "vertical",
                    plotRect: sc.plotRect
                },
                mockRequestFrame,
                () => {}
            );

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 200, y: 150 });

            // Move right +30px (valid pan)
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 230, y: 150 });
            rafCallback!();
            const updateCountAtMid = emitted.filter(e => e.phase === "update").length;
            expect(updateCountAtMid).toBe(1);

            // Move further right to hit the [0, 60] clamp boundary
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 400, y: 150 });
            rafCallback!();
            const updateCountAtBoundary = emitted.filter(e => e.phase === "update").length;
            expect(updateCountAtBoundary).toBe(2);

            // Move even further right past boundary (+200px)
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 600, y: 150 });
            rafCallback!();

            // Additional movement emits 0 extra updates
            const finalUpdateCount = emitted.filter(e => e.phase === "update").length;
            expect(finalUpdateCount).toBe(updateCountAtBoundary);

            controller.destroy();
        });
    });

    describe("Controlled Mode Event History Fidelity", () => {
        it("should retain proposal history in previousViewport under controlled mode", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            const emitted: ChartViewportChangeEvent[] = [];

            let rafCallback: (() => void) | null = null;
            const mockRequestFrame = (cb: () => void) => {
                rafCallback = cb;
                return 1;
            };

            const controller = new ChartViewportGestureController(
                {
                    axisScenes: sc.axes,
                    coordinateSpace,
                    currentViewport: createEmptyInternalViewportState(),
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: false,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.0015,
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: () => {},
                    onViewportChange: (_next, ev) => {
                        emitted.push(ev);
                    },
                    orientation: "vertical",
                    plotRect: sc.plotRect
                },
                mockRequestFrame,
                () => {}
            );

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 200, y: 150 });

            // Step 1: Move to 250px
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 250, y: 150 });
            rafCallback!();

            // Step 2: Move to 280px
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 280, y: 150 });
            rafCallback!();

            expect(emitted.length).toBe(3); // start, update 1, update 2
            const update1 = emitted[1];
            const update2 = emitted[2];

            // update2's previousViewport must equal update1's viewport
            expect(update2.previousViewport).toEqual(update1.viewport);

            controller.destroy();
        });
    });

    describe("Gesture Authority Revision & Safe Cancellation", () => {
        it("should safely cancel active gesture session when authorityToken changes", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            let releasedCapture = false;
            let cursor: string | null = "default";

            const controller = new ChartViewportGestureController(
                {
                    authorityToken: 1,
                    axisScenes: sc.axes,
                    coordinateSpace,
                    currentViewport: createEmptyInternalViewportState(),
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: false,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.0015,
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: c => {
                        cursor = c;
                    },
                    onViewportChange: () => {},
                    orientation: "vertical",
                    plotRect: sc.plotRect,
                    releasePointerCapture: () => {
                        releasedCapture = true;
                    }
                },
                () => 1,
                () => {}
            );

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 200, y: 150 });
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 250, y: 150 });

            expect(controller.isDragging).toBe(true);

            // Authority changes (e.g. data or layout revision)
            controller.updateContext({
                authorityToken: 2,
                axisScenes: sc.axes,
                coordinateSpace,
                currentViewport: createEmptyInternalViewportState(),
                navigationOptions: {
                    ...DEFAULT_NAVIGATION_OPTIONS,
                    clampToData: false,
                    dragPan: true,
                    enabled: true,
                    panAxes: "xy",
                    pinchZoom: true,
                    wheelSensitivity: 0.0015,
                    wheelZoom: true,
                    zoomAxes: "xy"
                },
                onCursorChange: c => {
                    cursor = c;
                },
                onViewportChange: () => {},
                orientation: "vertical",
                plotRect: sc.plotRect,
                releasePointerCapture: () => {
                    releasedCapture = true;
                }
            });

            expect(controller.isDragging).toBe(false);
            expect(releasedCapture).toBe(true);
            expect(cursor).toBeNull();

            controller.destroy();
        });
    });

    describe("Cumulative Wheel Scaling Policy", () => {
        it("should allow cumulative wheel zoom beyond factor 2.0 without arbitrary clamp ceiling", () => {
            const chart = host.chart();
            const sc = chart.scene() as CartesianXYChartScene;
            const coordinateSpace = sc.coordinateSpace!;

            const emitted: ChartViewportChangeEvent[] = [];
            let currentVp = createEmptyInternalViewportState();

            let rafCallback: (() => void) | null = null;
            const mockRequestFrame = (cb: () => void) => {
                rafCallback = cb;
                return 1;
            };

            const controller = new ChartViewportGestureController(
                {
                    axisScenes: sc.axes,
                    coordinateSpace,
                    currentViewport: currentVp,
                    navigationOptions: {
                        ...DEFAULT_NAVIGATION_OPTIONS,
                        clampToData: false,
                        dragPan: true,
                        enabled: true,
                        panAxes: "xy",
                        pinchZoom: true,
                        wheelSensitivity: 0.01, // aggressive sensitivity to test cumulative zoom
                        wheelZoom: true,
                        zoomAxes: "xy"
                    },
                    onCursorChange: () => {},
                    onViewportChange: (next, ev) => {
                        currentVp = next;
                        emitted.push(ev);
                    },
                    orientation: "vertical",
                    plotRect: sc.plotRect
                },
                mockRequestFrame,
                () => {}
            );

            const wheelEvent = {
                ctrlKey: true,
                deltaMode: 0,
                deltaY: -300 // Zoom in
            } as WheelEvent;

            // Scroll 1
            controller.handleWheel(wheelEvent, { x: 200, y: 150 });
            rafCallback!();

            // Scroll 2 (cumulative)
            controller.handleWheel(wheelEvent, { x: 200, y: 150 });
            rafCallback!();

            // Scroll 3 (cumulative)
            controller.handleWheel(wheelEvent, { x: 200, y: 150 });
            rafCallback!();

            const lastUpdate = emitted[emitted.length - 1];
            expect(lastUpdate.viewport.axes.length).toBeGreaterThan(0);

            const xWindow = lastUpdate.viewport.axes.find(a => a.axis === "x" && a.kind === "continuous");
            if (xWindow && xWindow.kind === "continuous") {
                const span = Number(xWindow.max) - Number(xWindow.min);
                // Initial span was 100. With 3 x -300 ticks @ 0.01 sens (exp(-9) = factor ~0.00012),
                // span should be much narrower than 50 (which would be 2x)
                expect(span).toBeLessThan(20);
            }

            controller.destroy();
        });
    });
});
