import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
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
        <mona-chart [animation]="false" [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-brush
                [activation]="'drag'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushRetirementHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Centralized Retirement Authority", () => {
    let fixture: ComponentFixture<BrushRetirementHostComponent>;
    let host: BrushRetirementHostComponent;

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
            imports: [BrushRetirementHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BrushRetirementHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("emits cancel with reason 'escape' on Escape key press during drag", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Start drag
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 200,
                clientY: 200,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Press Escape on mona-chart host
        const monaChartEl = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;
        monaChartEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        fixture.detectChanges();

        const cancelEvents = host.brushEvents.filter(e => e.phase === "cancel");
        expect(cancelEvents.length).toBe(1);
        expect(cancelEvents[0].cancelReason).toBe("escape");
    });

    it("emits cancel with reason 'pointer-cancel' on pointercancel event", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Start drag
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 200,
                clientY: 200,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Pointer Cancel
        chartEl.dispatchEvent(
            new PointerEvent("pointercancel", {
                clientX: 200,
                clientY: 200,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        const cancelEvents = host.brushEvents.filter(e => e.phase === "cancel");
        expect(cancelEvents.length).toBe(1);
        expect(cancelEvents[0].cancelReason).toBe("pointer-cancel");
    });
});
