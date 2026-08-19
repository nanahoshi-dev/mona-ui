import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartComponent } from "./chart.component";
import type { CartesianChartScene } from "../../internal/scene/chart-scene";
import type { ChartPointEvent } from "../../models/chart-event.models";

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartLegendComponent,
        ChartTooltipComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400" (pointClick)="onPointClick($event)">
            <mona-chart-x-axis axisId="x-main" field="month" type="category" />
            <mona-chart-y-axis axisId="y-temp" position="left" title="Temperature (°C)" />
            <mona-chart-y-axis axisId="y-precip" position="right" title="Precipitation (mm)" />
            <mona-chart-legend />
            <mona-chart-tooltip />
            <mona-line-series field="temp" name="Temperature" xAxisId="x-main" yAxisId="y-temp" />
            <mona-bar-series field="precip" name="Precipitation" xAxisId="x-main" yAxisId="y-precip" />
        </mona-chart>
    `
})
class DualYAxisChartTestComponent {
    public readonly data = signal([
        { month: "Jan", precip: 50, temp: 5 },
        { month: "Feb", precip: 80, temp: 7 },
        { month: "Mar", precip: 60, temp: 12 }
    ]);
    public lastClick: ChartPointEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastClick = event;
    }
}

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis axisId="x-years" field="year" type="linear" position="bottom" title="Year" />
            <mona-chart-x-axis axisId="x-index" field="index" type="linear" position="top" title="Time Index" />
            <mona-chart-y-axis axisId="y-log" type="log" [logBase]="10" title="Logarithmic Growth" />
            <mona-line-series field="val" name="Growth" xAxisId="x-years" yAxisId="y-log" />
        </mona-chart>
    `
})
class RichScaleAndDualXAxisChartTestComponent {
    public readonly data = signal([
        { index: 1, val: 10, year: 2020 },
        { index: 2, val: 100, year: 2021 },
        { index: 3, val: 1000, year: 2022 }
    ]);
}

describe("Chart Multi-Axis & Rich Scale Integration", () => {
    describe("Dual Y-Axes Chart", () => {
        let fixture: ComponentFixture<DualYAxisChartTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [DualYAxisChartTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(DualYAxisChartTestComponent);
            fixture.detectChanges();
        });

        it("should render 2 Y-axes with left and right positioning", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene).toBeDefined();
            expect(scene.axes.length).toBe(3);

            const yLeft = scene.axes.find(a => a.axisId === "y-temp");
            const yRight = scene.axes.find(a => a.axisId === "y-precip");

            expect(yLeft).toBeDefined();
            expect(yRight).toBeDefined();
            expect(yLeft?.position).toBe("left");
            expect(yRight?.position).toBe("right");
            expect(yLeft?.title).toBe("Temperature (°C)");
            expect(yRight?.title).toBe("Precipitation (mm)");
        });

        it("should map series data points against their respective bound axes", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene.series.length).toBe(2);
            const lineScene = scene.series[0];
            const barScene = scene.series[1];

            expect(lineScene.type).toBe("line");
            expect(barScene.type).toBe("bar");

            // Verify hit targets carry corresponding axis IDs and titles
            const tempHits = scene.hitTargets.filter(h => h.seriesId === lineScene.id);
            const precipHits = scene.hitTargets.filter(h => h.seriesId === barScene.id);

            expect(tempHits.length).toBe(3);
            expect(precipHits.length).toBe(3);

            expect(tempHits[0].yAxisId).toBe("y-temp");
            expect(tempHits[0].yAxisTitle).toBe("Temperature (°C)");

            expect(precipHits[0].yAxisId).toBe("y-precip");
            expect(precipHits[0].yAxisTitle).toBe("Precipitation (mm)");
        });
    });

    describe("Rich Scale & Dual X-Axes Chart", () => {
        let fixture: ComponentFixture<RichScaleAndDualXAxisChartTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [RichScaleAndDualXAxisChartTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(RichScaleAndDualXAxisChartTestComponent);
            fixture.detectChanges();
        });

        it("should layout dual X-axes and compute logarithmic scale on Y axis", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene).toBeDefined();
            expect(scene.axes.length).toBe(3);

            const xBottom = scene.axes.find(a => a.axisId === "x-years");
            const xTop = scene.axes.find(a => a.axisId === "x-index");
            const yLog = scene.axes.find(a => a.axisId === "y-log");

            expect(xBottom?.position).toBe("bottom");
            expect(xTop?.position).toBe("top");
            expect(yLog?.scaleType).toBe("log");

            // Line series correctly laid out with 3 points
            expect(scene.series.length).toBe(1);
            if (scene.series[0].type === "line") {
                expect(scene.series[0].points.length).toBe(3);
            }
        });
    });
});
