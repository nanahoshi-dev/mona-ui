import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type {
    ChartBrushActivation,
    ChartBrushChangeEvent,
    ChartBrushHitPolicy,
    ChartBrushLineStyle,
    ChartBrushMode,
    ChartBrushSelectionBehavior
} from "../../models/chart-brush.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartBrushComponent
    ],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-brush
                [enabled]="brushEnabled()"
                [activation]="brushActivation()"
                [mode]="brushMode()"
                [hitPolicy]="brushHitPolicy()"
                [selectionBehavior]="brushSelectionBehavior()"
                [minDragDistance]="brushMinDragDistance()"
                [xAxisId]="brushXAxisId()"
                [yAxisId]="brushYAxisId()"
                [fillColor]="brushFillColor()"
                [fillOpacity]="brushFillOpacity()"
                [borderColor]="brushBorderColor()"
                [borderWidth]="brushBorderWidth()"
                [lineStyle]="brushLineStyle()"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushAuthorityHostComponent {
    public readonly brushActivation = signal<ChartBrushActivation>("drag");
    public readonly brushBorderColor = signal<string | undefined>(undefined);
    public readonly brushBorderWidth = signal<number | undefined>(undefined);
    public readonly brushEnabled = signal(true);
    public readonly brushFillColor = signal<string | undefined>(undefined);
    public readonly brushFillOpacity = signal<number | undefined>(undefined);
    public readonly brushHitPolicy = signal<ChartBrushHitPolicy>("intersect");
    public readonly brushLineStyle = signal<ChartBrushLineStyle | undefined>(undefined);
    public readonly brushMinDragDistance = signal<number>(4);
    public readonly brushMode = signal<ChartBrushMode>("xy");
    public readonly brushSelectionBehavior = signal<ChartBrushSelectionBehavior>("none");
    public readonly brushXAxisId = signal<string | undefined>(undefined);
    public readonly brushYAxisId = signal<string | undefined>(undefined);
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Authority and Lifecycle", () => {
    let fixture: ComponentFixture<BrushAuthorityHostComponent>;
    let host: BrushAuthorityHostComponent;

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
        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.releasePointerCapture = vi.fn();
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
            imports: [BrushAuthorityHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BrushAuthorityHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("does not acquire pointer capture on pointerdown; acquires capture only when threshold is exceeded", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        const setCaptureSpy = vi.spyOn(chartEl, "setPointerCapture");

        // Pointer down
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Must NOT have called setPointerCapture immediately
        expect(setCaptureSpy).not.toHaveBeenCalled();

        // Small move below 4px threshold
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 51,
                clientY: 51,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();
        expect(setCaptureSpy).not.toHaveBeenCalled();

        // Move exceeding threshold (dx=10, dy=10)
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 60,
                clientY: 60,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Pointer capture should be acquired now
        expect(setCaptureSpy).toHaveBeenCalledWith(1);
    });

    it("clears pending gesture cleanly when pointer leaves before threshold is met", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Pointer down
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Pointer leave before moving beyond 4px threshold
        chartEl.dispatchEvent(
            new PointerEvent("pointerleave", {
                clientX: 51,
                clientY: 51,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Pointer up outside
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 51,
                clientY: 51,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // No brush events emitted at all
        expect(host.brushEvents.length).toBe(0);
    });

    it("emits cancel event with explicit cancelReason when Escape key is pressed during active brush", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(1);

        // Press Escape
        const container = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;
        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("escape");
    });

    it("emits cancel event with cancelReason 'pointer-cancel' when pointercancel occurs", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // Dispatch pointercancel
        chartEl.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("pointer-cancel");
    });

    it("emits cancel event with cancelReason 'data-change' when chart data changes during active brush", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // Mutate chart data
        host.data.set([
            { name: "X", value: 100 },
            { name: "Y", value: 200 }
        ]);
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("data-change");
    });

    it("emits cancel event with cancelReason 'disabled' and reports frozen session mode when brush enabled becomes false", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushMode.set("x");
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // Disable brush
        host.brushEnabled.set(false);
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("disabled");
        expect(host.brushEvents[1].mode).toBe("x");
    });

    describe("Pre-threshold candidate silent discard matrix", () => {
        const testPreThresholdDiscard = (label: string, mutate: () => void) => {
            it(`silently discards pre-threshold candidate when ${label} changes`, () => {
                const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

                // Pointer down
                chartEl.dispatchEvent(
                    new PointerEvent("pointerdown", {
                        clientX: 50,
                        clientY: 50,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                fixture.detectChanges();

                // Move 1px (< 4px threshold)
                chartEl.dispatchEvent(
                    new PointerEvent("pointermove", {
                        clientX: 51,
                        clientY: 51,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                fixture.detectChanges();

                // Mutate authority input while pre-threshold
                mutate();
                fixture.detectChanges();

                // Subsequent move exceeding threshold
                chartEl.dispatchEvent(
                    new PointerEvent("pointermove", {
                        clientX: 150,
                        clientY: 150,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                host.chart().flushPendingRender();
                fixture.detectChanges();

                // Pointer up
                chartEl.dispatchEvent(
                    new PointerEvent("pointerup", {
                        clientX: 150,
                        clientY: 150,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                fixture.detectChanges();

                // Must NOT have emitted any brush events
                expect(host.brushEvents.length).toBe(0);
            });
        };

        testPreThresholdDiscard("activation", () => host.brushActivation.set("shift-drag"));
        testPreThresholdDiscard("mode", () => host.brushMode.set("y"));
        testPreThresholdDiscard("xAxisId", () => host.brushXAxisId.set("x2"));
        testPreThresholdDiscard("yAxisId", () => host.brushYAxisId.set("y2"));
        testPreThresholdDiscard("minDragDistance", () => host.brushMinDragDistance.set(20));
        testPreThresholdDiscard("hitPolicy", () => host.brushHitPolicy.set("center"));
        testPreThresholdDiscard("selectionBehavior", () => host.brushSelectionBehavior.set("replace"));
    });

    describe("Post-threshold active brush authority cancel matrix", () => {
        const testPostThresholdCancel = (
            label: string,
            mutate: () => void,
            expectedCancelMode: ChartBrushMode = "x"
        ) => {
            it(`cancels active brush with cancelReason 'authority-change' and frozen session mode when ${label} changes`, () => {
                const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

                host.brushMode.set("x");
                fixture.detectChanges();

                chartEl.dispatchEvent(
                    new PointerEvent("pointerdown", {
                        clientX: 50,
                        clientY: 50,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                chartEl.dispatchEvent(
                    new PointerEvent("pointermove", {
                        clientX: 100,
                        clientY: 100,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                host.chart().flushPendingRender();
                fixture.detectChanges();

                expect(host.brushEvents.length).toBe(1);
                expect(host.brushEvents[0].phase).toBe("start");
                expect(host.brushEvents[0].mode).toBe("x");

                // Mutate authority input
                mutate();
                fixture.detectChanges();

                expect(host.brushEvents.length).toBe(2);
                expect(host.brushEvents[1].phase).toBe("cancel");
                expect(host.brushEvents[1].cancelReason).toBe("authority-change");
                expect(host.brushEvents[1].mode).toBe(expectedCancelMode);

                // Subsequent pointerup emits no end event
                chartEl.dispatchEvent(
                    new PointerEvent("pointerup", {
                        clientX: 100,
                        clientY: 100,
                        pointerId: 1,
                        pointerType: "mouse",
                        bubbles: true
                    })
                );
                fixture.detectChanges();
                expect(host.brushEvents.length).toBe(2);
            });
        };

        testPostThresholdCancel("activation", () => host.brushActivation.set("shift-drag"), "x");
        testPostThresholdCancel("mode (x -> y)", () => host.brushMode.set("y"), "x");
        testPostThresholdCancel("xAxisId", () => host.brushXAxisId.set("x2"), "x");
        testPostThresholdCancel("yAxisId", () => host.brushYAxisId.set("y2"), "x");
        testPostThresholdCancel("minDragDistance", () => host.brushMinDragDistance.set(20), "x");
        testPostThresholdCancel("hitPolicy", () => host.brushHitPolicy.set("center"), "x");
        testPostThresholdCancel("selectionBehavior", () => host.brushSelectionBehavior.set("replace"), "x");
    });

    describe("Presentation style non-cancellation", () => {
        it("does not cancel active brush when presentation style inputs change", () => {
            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

            chartEl.dispatchEvent(
                new PointerEvent("pointerdown", {
                    clientX: 50,
                    clientY: 50,
                    pointerId: 1,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 100,
                    clientY: 100,
                    pointerId: 1,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            host.chart().flushPendingRender();
            fixture.detectChanges();

            expect(host.brushEvents.length).toBe(1);

            // Update fill color, fill opacity, border color, border width, and line style
            host.brushFillColor.set("rgba(255, 0, 0, 0.3)");
            host.brushFillOpacity.set(0.5);
            host.brushBorderColor.set("#3b82f6");
            host.brushBorderWidth.set(2);
            host.brushLineStyle.set("dashed");
            fixture.detectChanges();

            // Active brush must remain uncancelled
            expect(host.brushEvents.length).toBe(1);
        });
    });
});
