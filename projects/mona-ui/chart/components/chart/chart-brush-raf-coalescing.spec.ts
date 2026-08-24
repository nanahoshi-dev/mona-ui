import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";

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
                [activation]="'drag'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushRafHostComponent {
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

describe("Chart Brush RAF Coalescing", () => {
    let fixture: ComponentFixture<BrushRafHostComponent>;
    let host: BrushRafHostComponent;

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
            strokeRect: vi.fn()
        } as any);

        await TestBed.configureTestingModule({
            imports: [BrushRafHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BrushRafHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("coalesces multiple intermediate pointermove events into a single presentation frame", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Pointer down
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // 3 rapid pointermove events in the same tick
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 70,
                clientY: 70,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 150,
                clientY: 150,
                pointerType: "mouse",
                bubbles: true
            })
        );

        // Before RAF flush, no intermediate uncoalesced emissions
        expect(host.brushEvents.length).toBe(0);

        // Flush RAF presentation frame
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // Should have emitted a single start/update frame with the latest bounds
        expect(host.brushEvents.length).toBe(1);
        expect(host.brushEvents[0].phase).toBe("start");
        expect(host.brushEvents[0].pixelBounds).toEqual({
            x: 50,
            y: 50,
            width: 100,
            height: 100
        });
    });

    it("preserves start phase when moves are coalesced and pointerup terminates the gesture", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 120,
                clientY: 120,
                pointerType: "mouse",
                bubbles: true
            })
        );

        // Pointer up immediately without manual flush in between
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 120,
                clientY: 120,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Should emit start then end cleanly without swallowed start event
        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[0].phase).toBe("start");
        expect(host.brushEvents[1].phase).toBe("end");
        expect(host.brushEvents[1].pixelBounds).toEqual({
            x: 50,
            y: 50,
            width: 70,
            height: 70
        });
    });

    it("cancels scheduled RAF handle on manual flush and allows subsequent pointermove to schedule a new frame", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        const rafCallbacks: FrameRequestCallback[] = [];
        const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
        const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
                bubbles: true
            })
        );

        expect(rafSpy).toHaveBeenCalled();
        const capturedCallback = rafCallbacks[0];
        expect(capturedCallback).toBeDefined();

        // Manual flush should cancel the pending RAF
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(cancelSpy).toHaveBeenCalled();
        expect(host.brushEvents.length).toBe(1);
        expect(host.brushEvents[0].phase).toBe("start");

        // Invoking the stale first callback must be a safe no-op
        const eventsBefore = host.brushEvents.length;
        capturedCallback(performance.now());
        fixture.detectChanges();
        expect(host.brushEvents.length).toBe(eventsBefore);

        // Subsequent move should schedule a new RAF
        const prevCallCount = rafSpy.mock.calls.length;
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 150,
                clientY: 150,
                pointerType: "mouse",
                bubbles: true
            })
        );
        expect(rafSpy.mock.calls.length).toBeGreaterThan(prevCallCount);

        // Flushing the second scheduled RAF frame emits the update event
        const secondCallback = rafCallbacks[1];
        expect(secondCallback).toBeDefined();
        secondCallback(performance.now());
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("update");

        rafSpy.mockRestore();
        cancelSpy.mockRestore();
    });

    it("coalesces transient interaction retirement into a single paint on first brush frame", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Hover over bar to establish transient hover state
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 100,
                clientY: 200,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");
        const paintCountBefore = renderSpy.mock.calls.length;

        // Pointer down and cross threshold
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 120,
                clientY: 120,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // Paint should have occurred exactly once for the flushed brush frame
        expect(renderSpy.mock.calls.length - paintCountBefore).toBe(1);
        expect(host.brushEvents.length).toBe(1);
        expect(host.brushEvents[0].phase).toBe("start");

        renderSpy.mockRestore();
    });
});
