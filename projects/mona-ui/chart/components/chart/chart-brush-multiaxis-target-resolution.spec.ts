import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
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
            <mona-chart-x-axis [axisId]="'xPrimary'" />
            <mona-chart-y-axis [axisId]="'yLeft'" [position]="'left'" />
            <mona-chart-y-axis [axisId]="'yRight'" [position]="'right'" />
            <mona-line-series [field]="'v1'" [name]="'Series 1'" [yAxisId]="'yLeft'" />
            <mona-line-series [field]="'v2'" [name]="'Series 2'" [yAxisId]="'yRight'" />
            <mona-chart-brush
                [activation]="'drag'"
                [yAxisId]="brushYAxisId()"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushMultiAxisHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", v1: 10, v2: 100 },
        { name: "B", v1: 20, v2: 200 },
        { name: "C", v1: 30, v2: 300 }
    ]);
    public readonly brushYAxisId = signal<string | undefined>("yLeft");
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Multi-Axis Target Resolution", () => {
    let fixture: ComponentFixture<BrushMultiAxisHostComponent>;
    let host: BrushMultiAxisHostComponent;

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
            imports: [BrushMultiAxisHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BrushMultiAxisHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        host.chart().recomputeScene();
    });

    it("filters matched marks to only the targeted Y axis", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        // Targeted to yLeft
        host.brushYAxisId.set("yLeft");
        fixture.detectChanges();
        host.chart().recomputeScene();

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
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        const endEvent = host.brushEvents.find(e => e.phase === "end");
        expect(endEvent).toBeDefined();
        expect(endEvent?.matchedPoints).toBeDefined();

        // Every matched point should belong to yLeft series (Series 1)
        for (const pt of endEvent!.matchedPoints!) {
            expect(pt.seriesName).toBe("Series 1");
        }
    });

    it("warns in dev mode and does not match marks on invalid yAxisId dimension", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushYAxisId.set("nonExistentAxis");
        fixture.detectChanges();
        host.chart().recomputeScene();

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
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain('Brush yAxisId "nonExistentAxis" does not exist');
        const endEvent = host.brushEvents.find(e => e.phase === "end");
        expect(endEvent).toBeDefined();
        // Since Y axis is invalid, yRange must be undefined and no marks matched
        expect(endEvent?.yRange).toBeUndefined();
        expect(endEvent?.matchedMarkIds?.length).toBe(0);
        expect(endEvent?.matchedPoints?.length).toBe(0);
        warnSpy.mockRestore();
    });

    it("resolves primary axes when axis IDs are omitted and matches only primary-bound marks", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushYAxisId.set(undefined);
        fixture.detectChanges();
        host.chart().recomputeScene();

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
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        const endEvent = host.brushEvents.find(e => e.phase === "end");
        expect(endEvent).toBeDefined();
        expect(endEvent?.xRange?.axisId).toBe("xPrimary");
        expect(endEvent?.yRange?.axisId).toBe("yLeft");
        expect(endEvent?.matchedPoints?.length).toBeGreaterThan(0);
        for (const pt of endEvent!.matchedPoints!) {
            expect(pt.seriesName).toBe("Series 1");
        }
    });

    it("targets explicit secondary Y axis and matches only secondary series marks", () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

        host.brushYAxisId.set("yRight");
        fixture.detectChanges();
        host.chart().recomputeScene();

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
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        chartEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 450,
                clientY: 300,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        const endEvent = host.brushEvents.find(e => e.phase === "end");
        expect(endEvent).toBeDefined();
        expect(endEvent?.yRange?.axisId).toBe("yRight");
        expect(endEvent?.matchedPoints?.length).toBeGreaterThan(0);
        for (const pt of endEvent!.matchedPoints!) {
            expect(pt.seriesName).toBe("Series 2");
        }
    });
});
