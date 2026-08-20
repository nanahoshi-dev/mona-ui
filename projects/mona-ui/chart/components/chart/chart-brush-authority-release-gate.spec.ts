import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";

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
            <mona-chart-x-axis [id]="'xPrimary'" />
            <mona-chart-y-axis [id]="'yPrimary'" />
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
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushAuthorityHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public readonly brushEnabled = signal(true);
    public readonly brushActivation = signal<import("../../models/chart-brush.models").ChartBrushActivation>("drag");
    public readonly brushMode = signal<import("../../models/chart-brush.models").ChartBrushMode>("xy");
    public readonly brushHitPolicy = signal<import("../../models/chart-brush.models").ChartBrushHitPolicy>("intersect");
    public readonly brushSelectionBehavior = signal<import("../../models/chart-brush.models").ChartBrushSelectionBehavior>("none");
    public readonly brushMinDragDistance = signal<number>(4);
    public readonly brushXAxisId = signal<string | undefined>(undefined);
    public readonly brushYAxisId = signal<string | undefined>(undefined);
    public readonly brushFillColor = signal<string | undefined>(undefined);
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Authority & Lifecycle Release Gate (GDSB-R2-002, GDSB-R2-003, GDSB-R2-004, GDSB-R3-001)", () => {
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

    it("emits cancel event with cancelReason 'disabled' when brush enabled becomes false", () => {
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

        // Disable brush
        host.brushEnabled.set(false);
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("disabled");
    });

    it("silently discards pre-threshold candidate when configuration mode changes before threshold", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushMode.set("x");
        fixture.detectChanges();

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

        // Mode changes to 'y' while pre-threshold
        host.brushMode.set("y");
        fixture.detectChanges();

        // Move beyond threshold with the old pointer
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

        // Must NOT have emitted any start, update, end, or cancel events
        expect(host.brushEvents.length).toBe(0);
    });

    it("emits authority-change cancel when mode changes during post-threshold active brush", () => {
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

        // Change mode to 'y'
        host.brushMode.set("y");
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("cancel");
        expect(host.brushEvents[1].cancelReason).toBe("authority-change");

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

    it("silently discards pre-threshold candidate when minDragDistance changes before threshold", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushMinDragDistance.set(20);
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
                clientX: 55,
                clientY: 55,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Change minDragDistance to 2
        host.brushMinDragDistance.set(2);
        fixture.detectChanges();

        // Old candidate was retired, so continued move should not trigger brush
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 60,
                clientY: 60,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(0);
    });

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

        // Update fill color (style property)
        host.brushFillColor.set("rgba(255, 0, 0, 0.3)");
        fixture.detectChanges();

        // Active brush must remain uncancelled
        expect(host.brushEvents.length).toBe(1);
    });
});
