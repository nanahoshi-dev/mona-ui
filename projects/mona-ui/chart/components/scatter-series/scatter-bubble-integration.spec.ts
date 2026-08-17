import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { CartesianChartScene } from "../../internal/scene/chart-scene";
import type { ChartPointEvent, ChartSeriesVisibilityEvent } from "../../models/chart-event.models";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaChartLegendComponent } from "../chart-legend/chart-legend.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { MonaChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { MonaChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { MonaBubbleSeriesComponent } from "../bubble-series/bubble-series.component";
import { MonaScatterSeriesComponent } from "./scatter-series.component";

@Component({
    imports: [
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent,
        MonaScatterSeriesComponent,
        MonaBubbleSeriesComponent
    ],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="xField()"
            (pointClick)="onPointClick($event)"
            (seriesVisibilityChange)="onSeriesVisibilityChange($event)"
            style="width: 500px; height: 300px; display: block;">
            <mona-chart-x-axis type="linear" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-chart-tooltip />

            <mona-scatter-series
                field="y1"
                name="Scatter A"
                [pointRadius]="6"
                [color]="'#3b82f6'"
                [(visible)]="scatterVisible" />

            <mona-bubble-series
                field="y2"
                sizeField="pop"
                name="Bubble B"
                [minRadius]="5"
                [maxRadius]="25"
                [color]="'#10b981'"
                [(visible)]="bubbleVisible" />
        </mona-chart>
    `
})
class ScatterBubbleTestHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { pop: 100, x: 10, y1: 20, y2: 30 },
        { pop: 400, x: 20, y1: 40, y2: 50 },
        { pop: 900, x: 30, y1: 60, y2: 70 },
        { pop: 1600, x: 30, y1: 80, y2: 90 } // Duplicate X = 30
    ]);
    public readonly xField = signal("x");
    public readonly scatterVisible = signal(true);
    public readonly bubbleVisible = signal(true);

    public clickedPoint: ChartPointEvent | null = null;
    public lastVisibilityChange: ChartSeriesVisibilityEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.clickedPoint = event;
    }

    public onSeriesVisibilityChange(event: ChartSeriesVisibilityEvent): void {
        this.lastVisibilityChange = event;
    }
}

describe("Scatter and Bubble Integration", () => {
    let fixture: ComponentFixture<ScatterBubbleTestHostComponent>;
    let host: ScatterBubbleTestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScatterBubbleTestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScatterBubbleTestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should compute Cartesian scene with Scatter and Bubble series scenes", () => {
        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent))
            .componentInstance as MonaChartComponent;
        const scene = chartComp.scene() as CartesianChartScene;

        expect(scene).not.toBeNull();
        expect(scene.coordinateSystem).toBe("cartesian");
        expect(scene.series.length).toBe(2);

        const scatterScene = scene.series.find(s => s.type === "scatter");
        const bubbleScene = scene.series.find(s => s.type === "bubble");

        expect(scatterScene).toBeDefined();
        expect(bubbleScene).toBeDefined();

        if (scatterScene && scatterScene.type === "scatter") {
            expect(scatterScene.markers.length).toBe(4);
            expect(scatterScene.pointRadius).toBe(6);
        }

        if (bubbleScene && bubbleScene.type === "bubble") {
            expect(bubbleScene.markers.length).toBe(4);
            expect(bubbleScene.minRadius).toBe(5);
            expect(bubbleScene.maxRadius).toBe(25);
            // Verify sqrt radius mapping: sqrt(100)=10 -> 5, sqrt(1600)=40 -> 25
            expect(bubbleScene.markers[0].radius).toBe(5);
            expect(bubbleScene.markers[3].radius).toBe(25);
        }
    });

    it("should render legend items and allow toggling series visibility", () => {
        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBe(2);
        expect(legendButtons[0].nativeElement.textContent).toContain("Scatter A");
        expect(legendButtons[1].nativeElement.textContent).toContain("Bubble B");

        // Toggle Scatter visibility off
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();

        expect(host.lastVisibilityChange).not.toBeNull();
        expect(host.lastVisibilityChange?.seriesName).toBe("Scatter A");
        expect(host.lastVisibilityChange?.visible).toBe(false);
        expect(host.scatterVisible()).toBe(false);
    });

    it("should support keyboard navigation across duplicate X coordinates", () => {
        const chartEl = fixture.debugElement.query(By.directive(MonaChartComponent));
        const chartComp = chartEl.componentInstance as MonaChartComponent;

        // Focus chart and press ArrowRight to select first bucket
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        fixture.detectChanges();

        // Navigate to last bucket (X = 30) with End key
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
        fixture.detectChanges();

        expect(chartComp.tooltipContext()).not.toBeNull();

        // Cycle through hits on the same bucket using ArrowDown
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        fixture.detectChanges();

        // Trigger Enter to click selected point
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        fixture.detectChanges();

        expect(host.clickedPoint).not.toBeNull();
        expect(host.clickedPoint?.xValue).toBe(30);
    });
});
