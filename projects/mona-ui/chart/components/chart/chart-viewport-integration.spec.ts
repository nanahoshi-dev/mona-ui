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

    it("should normalize controlled viewport against new data authority after structural data change (PZV5-005)", () => {
        // Controlled viewport set to [20, 80]
        host.viewport.set({
            axes: [
                { axis: "x", axisId: "x-main", kind: "continuous", min: 20, max: 80 }
            ]
        });
        fixture.detectChanges();

        // Expand data to [0, 500]
        host.data.set([
            { x: 0, y: 10 },
            { x: 250, y: 30 },
            { x: 500, y: 50 }
        ]);
        fixture.detectChanges();

        const chart = host.chart();
        const vp = chart.getViewport();
        const xAxis = vp?.axes.find(a => a.axisId === "x-main");
        expect(xAxis).toBeDefined();
        if (xAxis && xAxis.kind === "continuous") {
            expect(xAxis.min).toBe(20);
            expect(xAxis.max).toBe(80);
        }
    });

    it("should seed uncontrolled state from last normalized controlled viewport when transitioning to uncontrolled (PZV5-006)", () => {
        // Set controlled viewport
        host.viewport.set({
            axes: [
                { axis: "x", axisId: "x-main", kind: "continuous", min: 30, max: 70 }
            ]
        });
        fixture.detectChanges();

        // Clear controlled viewport -> transition to uncontrolled
        host.viewport.set(undefined);
        fixture.detectChanges();

        const chart = host.chart();
        const vp = chart.getViewport();
        const xAxis = vp?.axes.find(a => a.axisId === "x-main");
        expect(xAxis).toBeDefined();
        if (xAxis && xAxis.kind === "continuous") {
            // Uncontrolled state retained the [30, 70] window
            expect(xAxis.min).toBe(30);
            expect(xAxis.max).toBe(70);
        }
    });

    it("should perform full replacement with setViewport and partial mutation with setViewportWindow (PZV5-015)", () => {
        const chart = host.chart();

        // Set partial window on x
        chart.setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            min: 10,
            max: 90
        });
        fixture.detectChanges();

        let vp = chart.getViewport();
        expect(vp?.axes.length).toBe(1);

        // setViewport with empty axes resets all axes to full domain
        chart.setViewport({ axes: [] });
        fixture.detectChanges();

        vp = chart.getViewport();
        expect(vp?.axes.length).toBe(0);
    });

    it("should emit correct sources for fitViewport ('fit') and resetViewport ('reset') (PZV5-016)", () => {
        const chart = host.chart();

        chart.setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            min: 20,
            max: 80
        });
        fixture.detectChanges();

        host.emittedEvents.length = 0;

        chart.fitViewport();
        fixture.detectChanges();

        expect(host.emittedEvents.length).toBe(1);
        expect(host.emittedEvents[0].source).toBe("fit");

        chart.setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            min: 20,
            max: 80
        });
        fixture.detectChanges();

        host.emittedEvents.length = 0;

        chart.resetViewport();
        fixture.detectChanges();

        expect(host.emittedEvents.length).toBe(1);
        expect(host.emittedEvents[0].source).toBe("reset");
    });
});
