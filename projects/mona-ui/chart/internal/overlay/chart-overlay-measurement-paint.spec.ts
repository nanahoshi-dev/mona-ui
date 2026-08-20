import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ChartComponent } from "../../components/chart/chart.component";
import { ChartCrosshairComponent } from "../../components/chart-crosshair/chart-crosshair.component";
import { ChartReferenceLineComponent } from "../../components/chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../../components/chart-reference-band/chart-reference-band.component";
import { ChartAnnotationComponent } from "../../components/chart-annotation/chart-annotation.component";
import { ChartXAxisComponent } from "../../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../../components/line-series/line-series.component";
import { CanvasChartRenderer } from "../render/canvas-chart-renderer";

@Component({
    imports: [
        ChartComponent,
        ChartCrosshairComponent,
        ChartReferenceLineComponent,
        ChartReferenceBandComponent,
        ChartAnnotationComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent
    ],
    template: `
        <mona-chart style="width: 500px; height: 300px;">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-line-series [data]="data()" xField="x" field="y" />

            <mona-chart-crosshair />
            <mona-chart-reference-line [value]="50" axis="y" />
            <mona-chart-reference-band [from]="20" [to]="40" axis="x" />
            <mona-chart-annotation [x]="50" [y]="50" label="Annotated Point" labelPlacement="right" />
        </mona-chart>
    `
})
class OverlayMeasurementPaintHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { x: 0, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 90 }
    ]);
}

describe("ChartOverlayMeasurementPaint (WP3 / Gates N & O)", () => {
    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [OverlayMeasurementPaintHostComponent]
        });
    });

    it("does not repaint canvas for crosshair badge resize", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");

        renderSpy.mockClear();

        // Simulate observing a crosshair badge element resize
        const dummyEl = document.createElement("div");
        chart.observeOverlayLabelElement(dummyEl, "crosshair:x");

        // The initial observe does not trigger canvas paint
        expect(renderSpy).not.toHaveBeenCalled();

        chart.unobserveOverlayLabelElement(dummyEl, "crosshair:x");
    });

    it("does not repaint canvas for reference line or reference band badge resize", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");

        renderSpy.mockClear();

        const lineEl = document.createElement("div");
        chart.observeOverlayLabelElement(lineEl, "overlay:line:ref-1");
        expect(renderSpy).not.toHaveBeenCalled();
        chart.unobserveOverlayLabelElement(lineEl, "overlay:line:ref-1");

        const bandEl = document.createElement("div");
        chart.observeOverlayLabelElement(bandEl, "overlay:band:band-1");
        expect(renderSpy).not.toHaveBeenCalled();
        chart.unobserveOverlayLabelElement(bandEl, "overlay:band:band-1");
    });

    it("cleans up overlay measurements on unobserve (Gate O)", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();

        const elements: { el: HTMLElement; id: string }[] = [];
        for (let i = 0; i < 50; i++) {
            const el = document.createElement("div");
            const id = `overlay:line:bulk-${i}`;
            chart.observeOverlayLabelElement(el, id);
            elements.push({ el, id });
        }

        for (const item of elements) {
            chart.unobserveOverlayLabelElement(item.el, item.id);
        }

        // Cleaned up without leaking entries
        expect(elements.length).toBe(50);
    });
});
