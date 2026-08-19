import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartNavigationInput, ChartViewportChangeEvent, ChartViewportState } from "../../models/chart-viewport.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartComponent } from "./chart.component";

interface DataItem {
    x: number;
    y: number;
}

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            [xField]="xField()"
            [navigation]="navigation()"
            [viewport]="viewport()"
            [defaultViewport]="defaultViewport()"
            (viewportChange)="onViewportChange($event)"
            style="width: 500px; height: 300px; display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series [field]="yField" name="Series 1" />
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly yField = "y";
    public readonly data = signal<DataItem[]>([
        { x: 0, y: 10 },
        { x: 50, y: 25 },
        { x: 100, y: 50 }
    ]);
    public readonly xField = signal("x");
    public readonly navigation = signal<ChartNavigationInput>(true);
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
    public readonly defaultViewport = signal<ChartViewportState | undefined>(undefined);
    public readonly emittedEvents: ChartViewportChangeEvent[] = [];

    public onViewportChange(event: ChartViewportChangeEvent): void {
        this.emittedEvents.push(event);
    }
}

describe("ChartComponent Viewport Integration", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should initialize with full range viewport and allow zoom/pan imperatively", () => {
        const chart = host.chart();
        const initialViewport = chart.getViewport();
        expect(initialViewport).not.toBeNull();
        expect(initialViewport?.axes.length).toBe(0);

        // Zoom 2x
        chart.zoom(2);
        fixture.detectChanges();

        const zoomed = chart.getViewport();
        expect(zoomed).not.toBeNull();
        expect(zoomed?.axes.length).toBeGreaterThan(0);
        expect(host.emittedEvents.length).toBe(1);
        expect(host.emittedEvents[0].source).toBe("programmatic");

        // Pan 50px
        chart.pan({ x: 50, y: 0 });
        fixture.detectChanges();

        expect(host.emittedEvents.length).toBe(2);

        // Reset
        chart.resetViewport();
        fixture.detectChanges();

        const reset = chart.getViewport();
        expect(reset?.axes.length).toBe(0);
        expect(host.emittedEvents.length).toBe(3);
    });

    it("should fit viewport to explicit range", () => {
        const chart = host.chart();
        chart.fit({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 80,
            min: 20
        });
        fixture.detectChanges();

        const fitted = chart.getViewport();
        const xAxis = fitted?.axes.find(a => a.axisId === "x-main" && a.kind === "continuous");
        expect(xAxis).toBeDefined();
        if (xAxis && xAxis.kind === "continuous") {
            expect(xAxis.min).toBe(20);
            expect(xAxis.max).toBe(80);
        }
    });

    it("should respond to external viewport binding changes", () => {
        host.viewport.set({
            axes: [
                {
                    axis: "x",
                    axisId: "x-main",
                    kind: "continuous",
                    max: 75,
                    min: 25
                }
            ]
        });
        fixture.detectChanges();

        const chart = host.chart();
        const vp = chart.getViewport();
        const xAxis = vp?.axes.find(a => a.axisId === "x-main" && a.kind === "continuous");
        expect(xAxis).toBeDefined();
        if (xAxis && xAxis.kind === "continuous") {
            expect(xAxis.min).toBe(25);
            expect(xAxis.max).toBe(75);
        }
    });
});
