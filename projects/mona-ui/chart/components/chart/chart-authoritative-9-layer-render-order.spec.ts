import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartReferenceLineComponent } from "../chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../chart-reference-band/chart-reference-band.component";
import { CartesianChartRenderer } from "../../internal/render/cartesian-chart-renderer";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartBrushComponent,
        ChartReferenceLineComponent,
        ChartReferenceBandComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-chart-reference-band [axis]="'y'" [from]="5" [to]="15" />
            <mona-chart-reference-line [axis]="'y'" [value]="10" />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="true" />
            <mona-chart-selection />
            <mona-chart-brush />
        </mona-chart>
    `
})
class NineLayerRenderOrderHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart 9-Layer Authoritative Render Ordering (GDSB-R3-007)", () => {
    let fixture: ComponentFixture<NineLayerRenderOrderHostComponent>;
    let host: NineLayerRenderOrderHostComponent;

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
            strokeRect: vi.fn(),
            strokeText: vi.fn()
        } as any);

        await TestBed.configureTestingModule({
            imports: [NineLayerRenderOrderHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NineLayerRenderOrderHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("composes and invokes all 9 visual layers in strict 1-through-9 sequence on canvas render", () => {
        const callOrder: string[] = [];

        vi.spyOn(CartesianChartRenderer, "renderGridLayer").mockImplementation(() => {
            callOrder.push("1.renderGridLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderStaticUnderlayLayer").mockImplementation(() => {
            callOrder.push("2.renderStaticUnderlayLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderSeriesLayer").mockImplementation(() => {
            callOrder.push("3.renderSeriesLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderSelectionLayer").mockImplementation(() => {
            callOrder.push("4.renderSelectionLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderDataLabelLayer").mockImplementation(() => {
            callOrder.push("5.renderDataLabelLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderStaticOverlayLayer").mockImplementation(() => {
            callOrder.push("6.renderStaticOverlayLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderAxisLayer").mockImplementation(() => {
            callOrder.push("7.renderAxisLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderTransientLayer").mockImplementation(() => {
            callOrder.push("8.renderTransientLayer");
        });
        vi.spyOn(CartesianChartRenderer, "renderBrushLayer").mockImplementation(() => {
            callOrder.push("9.renderBrushLayer");
        });

        // Trigger chart render
        host.chart().invalidate();
        host.chart().flushPendingRender();
        fixture.detectChanges();

        expect(callOrder).toEqual([
            "1.renderGridLayer",
            "2.renderStaticUnderlayLayer",
            "3.renderSeriesLayer",
            "4.renderSelectionLayer",
            "5.renderDataLabelLayer",
            "6.renderStaticOverlayLayer",
            "7.renderAxisLayer",
            "8.renderTransientLayer",
            "9.renderBrushLayer"
        ]);
    });
});
