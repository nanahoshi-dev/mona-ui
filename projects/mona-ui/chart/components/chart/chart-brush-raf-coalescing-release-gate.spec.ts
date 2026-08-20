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

describe("Chart Brush RAF Coalescing Release Gate (GDSB-R2-001)", () => {
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
});
