import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import type { ChartRendererMode } from "../models/chart-renderer.models";

@Component({
    imports: [ChartComponent, BarSeriesComponent, ChartXAxisComponent, ChartYAxisComponent],
    template: `
        <mona-chart
            [renderer]="renderer()"
            [animation]="false"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="500"
            [style.height.px]="300">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bar'" />
        </mona-chart>
    `
})
class SvgRendererHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 25 },
        { name: "C", value: 40 }
    ]);
    public readonly renderer = signal<ChartRendererMode>("svg");
}

describe("SVG Rendering Abstraction & Parity", () => {
    let fixture: ComponentFixture<SvgRendererHostComponent>;
    let host: SvgRendererHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SvgRendererHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SvgRendererHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("renders SVG surface and layer DOM elements when renderer is 'svg'", () => {
        const svgEl = fixture.nativeElement.querySelector("svg");
        expect(svgEl).not.toBeNull();

        const canvasEl = fixture.nativeElement.querySelector("canvas");
        expect(canvasEl).toBeNull();

        // Check authoritative layer groups
        const gridLayer = svgEl.querySelector("g[data-layer='grid']");
        const seriesLayer = svgEl.querySelector("g[data-layer='series']");
        const axesLayer = svgEl.querySelector("g[data-layer='axes']");
        expect(gridLayer).not.toBeNull();
        expect(seriesLayer).not.toBeNull();
        expect(axesLayer).not.toBeNull();

        // Check bar series rendered elements inside series layer
        const paths = seriesLayer.querySelectorAll("path");
        expect(paths.length).toBe(3);
    });

    it("switches cleanly between 'canvas' and 'svg' renderers dynamically", async () => {
        host.renderer.set("canvas");
        fixture.detectChanges();
        await fixture.whenStable();

        let canvasEl = fixture.nativeElement.querySelector("canvas");
        let svgEl = fixture.nativeElement.querySelector("svg");
        expect(canvasEl).not.toBeNull();
        expect(svgEl).toBeNull();

        host.renderer.set("svg");
        fixture.detectChanges();
        await fixture.whenStable();

        canvasEl = fixture.nativeElement.querySelector("canvas");
        svgEl = fixture.nativeElement.querySelector("svg");
        expect(canvasEl).toBeNull();
        expect(svgEl).not.toBeNull();
    });
});
