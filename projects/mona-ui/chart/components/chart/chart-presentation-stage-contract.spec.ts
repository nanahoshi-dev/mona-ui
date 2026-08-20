import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartBrushComponent,
        ChartSelectionComponent
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
            <mona-chart-selection
                [mode]="'multiple'"
                (selectionChange)="onSelectionChange($event)" />
            <mona-chart-brush
                [activation]="'drag'"
                [selectionBehavior]="'add'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class PresentationStageContractHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public brushEvents: ChartBrushChangeEvent[] = [];
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Presentation Stage Contract Integration (GDSB-R2-001 through GDSB-R2-015)", () => {
    let fixture: ComponentFixture<PresentationStageContractHostComponent>;
    let host: PresentationStageContractHostComponent;

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
            imports: [PresentationStageContractHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PresentationStageContractHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("executes a complete brush-to-selection cycle with end emission and selection synchronization", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Pointer down inside plot rect
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 60,
                clientY: 60,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Pointer move
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 300,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(1);
        expect(host.brushEvents[0].phase).toBe("start");

        // Pointer up
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 300,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("end");
        expect(host.brushEvents[1].matchedMarkIds).toBeDefined();

        // Selection should have updated from brush with source "brush"
        if (host.brushEvents[1].matchedMarkIds!.length > 0) {
            expect(host.selectionEvents.length).toBeGreaterThan(0);
            expect(host.selectionEvents[host.selectionEvents.length - 1].source).toBe("brush");
        }
    });

    it("Stage A/B/C isolation: brush drag does not alter selection state until end phase (GDSB-R3-006)", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Pointer down inside plot rect
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 60,
                clientY: 60,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 250,
                clientY: 250,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        // During drag (Stage C active), selection (Stage B) must remain unmutated
        expect(host.brushEvents.length).toBe(1);
        expect(host.brushEvents[0].phase).toBe("start");
        expect(host.selectionEvents.length).toBe(0);

        // Pointer move further
        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 350,
                clientY: 350,
                pointerType: "mouse",
                bubbles: true
            })
        );
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(2);
        expect(host.brushEvents[1].phase).toBe("update");
        expect(host.selectionEvents.length).toBe(0);

        // Terminate gesture
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 350,
                clientY: 350,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        // Now phase="end" fires and synchronizes into selection
        expect(host.brushEvents.length).toBe(3);
        expect(host.brushEvents[2].phase).toBe("end");
        expect(host.selectionEvents.length).toBe(1);
        expect(host.selectionEvents[0].source).toBe("brush");
    });
});
