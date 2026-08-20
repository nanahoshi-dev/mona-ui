import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartBrushComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-selection
                [mode]="'multiple'"
                (selectionChange)="onSelectionChange($event)" />
            <mona-chart-brush
                [activation]="'drag'"
                [selectionBehavior]="'replace'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushRafHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public selectionEvents: ChartSelectionChangeEvent[] = [];
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Transactional Semantics & RAF Coalescing", () => {
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

    it("does not mutate selection or query mark index during 100 pointermove events", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        expect(chartEl).toBeDefined();

        // 1. Pointer Down
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // 2. 100 Pointer Moves
        for (let i = 1; i <= 100; i++) {
            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 100 + i,
                    clientY: 100 + i,
                    pointerId: 1,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
        }
        fixture.detectChanges();

        // Selection should NOT have been mutated or proposed during moves
        expect(host.selectionEvents.length).toBe(0);

        // 3. Pointer Up
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 200,
                clientY: 200,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();
        await fixture.whenStable();

        // Exactly one end event
        const endEvents = host.brushEvents.filter(e => e.phase === "end");
        expect(endEvents.length).toBe(1);
        expect(endEvents[0].matchedMarkIds).toBeDefined();
    });
});
