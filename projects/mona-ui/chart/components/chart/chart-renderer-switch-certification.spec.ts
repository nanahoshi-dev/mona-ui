import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";
import { CartesianLayoutEngine } from "../../internal/layout/cartesian-layout-engine";
import type { ChartRendererMode } from "../../models/chart-renderer.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartLegendComponent,
        ChartSelectionComponent
    ],
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
            <mona-bar-series [field]="'value'" [name]="'Bar Series'" />
            <mona-chart-legend />
            <mona-chart-selection [mode]="'single'" [selectedMarkIds]="selectedMarkIds()" />
        </mona-chart>
    `
})
class RendererSwitchCertificationHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly renderer = signal<ChartRendererMode>("canvas");
    public readonly selectedMarkIds = signal<readonly string[]>(["Bar Series:B"]);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 25 },
        { name: "C", value: 40 }
    ]);
}

describe("WP0: Chart Renderer Switch Certification", () => {
    let fixture: ComponentFixture<RendererSwitchCertificationHostComponent>;
    let host: RendererSwitchCertificationHostComponent;
    let stageASpy: ReturnType<typeof vi.spyOn>;
    let stageBSpy: ReturnType<typeof vi.spyOn>;
    let stageCSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 300,
            height: 300,
            left: 0,
            right: 500,
            top: 0,
            width: 500,
            x: 0,
            y: 0,
            toJSON: () => ({})
        });

        stageASpy = vi.spyOn(ChartLayoutEngine, "prepareStructural");
        stageBSpy = vi.spyOn(CartesianLayoutEngine, "recomputeChrome");
        stageCSpy = vi.spyOn(CartesianLayoutEngine, "projectRuntime");

        await TestBed.configureTestingModule({
            imports: [RendererSwitchCertificationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RendererSwitchCertificationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("certifies Canvas -> SVG -> Canvas switching maintains state, single surface, and A0/B0/C0", async () => {
        // Initial state: Canvas
        const chart = host.chart();
        const initialScene = chart.scene();
        expect(initialScene).not.toBeNull();
        expect(chart.renderer()).toBe("canvas");

        let canvasEl = fixture.nativeElement.querySelector("canvas");
        let svgEl = fixture.nativeElement.querySelector("svg");
        expect(canvasEl).not.toBeNull();
        expect(svgEl).toBeNull();

        // Reset stage spies after initial setup
        stageASpy.mockClear();
        stageBSpy.mockClear();
        stageCSpy.mockClear();

        // Switch to SVG
        host.renderer.set("svg");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(chart.renderer()).toBe("svg");
        const svgScene = chart.scene();
        expect(svgScene).toBe(initialScene); // Exact same semantic scene instance

        canvasEl = fixture.nativeElement.querySelector("canvas");
        svgEl = fixture.nativeElement.querySelector("svg");
        expect(canvasEl).toBeNull();
        expect(svgEl).not.toBeNull();

        // Must be A0/B0/C0 for renderer switch
        expect(stageASpy).not.toHaveBeenCalled();
        expect(stageBSpy).not.toHaveBeenCalled();
        expect(stageCSpy).not.toHaveBeenCalled();

        // Check SVG layers are present and valid
        const seriesLayer = svgEl.querySelector("g[data-layer='series']");
        expect(seriesLayer).not.toBeNull();
        const paths = seriesLayer.querySelectorAll("path");
        expect(paths.length).toBe(3);

        // Switch back to Canvas
        host.renderer.set("canvas");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(chart.renderer()).toBe("canvas");
        const canvasScene = chart.scene();
        expect(canvasScene).toBe(initialScene);

        canvasEl = fixture.nativeElement.querySelector("canvas");
        svgEl = fixture.nativeElement.querySelector("svg");
        expect(canvasEl).not.toBeNull();
        expect(svgEl).toBeNull();

        // Remains A0/B0/C0
        expect(stageASpy).not.toHaveBeenCalled();
        expect(stageBSpy).not.toHaveBeenCalled();
        expect(stageCSpy).not.toHaveBeenCalled();
    });
});
