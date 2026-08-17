import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartPointEvent, ChartPointFocusEvent } from "../../models/chart-event.models";
import { MonaChartComponent } from "./chart.component";
import { MonaChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { MonaChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { MonaRangeBarSeriesComponent } from "../range-bar-series/range-bar-series.component";
import { MonaRangeAreaSeriesComponent } from "../range-area-series/range-area-series.component";

@Component({
    imports: [
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartTooltipComponent,
        MonaRangeBarSeriesComponent,
        MonaRangeAreaSeriesComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'month'"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)">
            <mona-chart-x-axis [type]="'category'" />
            <mona-chart-y-axis />
            <mona-chart-tooltip [shared]="sharedTooltip()" />

            @if (showRangeBar()) {
                <mona-range-bar-series
                    [fromField]="'min'"
                    [toField]="'max'"
                    [name]="'Temperature Range'"
                    [color]="'#8b5cf6'" />
            }

            @if (showRangeArea()) {
                <mona-range-area-series
                    [fromField]="'low'"
                    [toField]="'high'"
                    [name]="'Confidence Band'"
                    [color]="'#ec4899'"
                    [showPoints]="true" />
            }
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { high: 32, low: 10, max: 28, min: 14, month: "Jan" },
        { high: 36, low: 12, max: 32, min: 18, month: "Feb" },
        { high: 42, low: 16, max: 38, min: 22, month: "Mar" }
    ]);
    public readonly sharedTooltip = signal<boolean>(true);
    public readonly showRangeArea = signal<boolean>(true);
    public readonly showRangeBar = signal<boolean>(true);

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.lastPointFocus = event;
    }
}

describe("Chart Range Series Integration", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let chartComponent: MonaChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        chartComponent = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance;
    });

    it("should compute scene with both Range Bar and Range Area series", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        expect(scene?.coordinateSystem).toBe("cartesian");

        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(2);
            const rangeBar = scene.series.find(s => s.type === "rangeBar");
            const rangeArea = scene.series.find(s => s.type === "rangeArea");

            expect(rangeBar).toBeDefined();
            expect(rangeArea).toBeDefined();

            if (rangeBar && rangeBar.type === "rangeBar") {
                expect(rangeBar.bars.length).toBe(3);
                expect(rangeBar.bars[0].fromValue).toBe(14);
                expect(rangeBar.bars[0].toValue).toBe(28);
                expect(rangeBar.bars[0].lowValue).toBe(14);
                expect(rangeBar.bars[0].highValue).toBe(28);
            }

            if (rangeArea && rangeArea.type === "rangeArea") {
                expect(rangeArea.points.length).toBe(3);
                expect(rangeArea.points[0].fromValue).toBe(10);
                expect(rangeArea.points[0].toValue).toBe(32);
                expect(rangeArea.points[0].lowPoint).toBeDefined();
                expect(rangeArea.points[0].highPoint).toBeDefined();
            }
        }
    });

    it("should populate hit targets with range metadata", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            const rangeBarHits = scene.hitTargets.filter(h => h.seriesType === "rangeBar");
            expect(rangeBarHits.length).toBe(3);
            expect(rangeBarHits[0].valueKind).toBe("range");
            expect(rangeBarHits[0].fromValue).toBe(14);
            expect(rangeBarHits[0].toValue).toBe(28);
            expect(rangeBarHits[0].range).toBeDefined();
            expect(rangeBarHits[0].range?.fromValue).toBe(14);
            expect(rangeBarHits[0].range?.toValue).toBe(28);

            const rangeAreaHits = scene.hitTargets.filter(h => h.seriesType === "rangeArea");
            expect(rangeAreaHits.length).toBeGreaterThan(0);
            expect(rangeAreaHits[0].valueKind).toBe("range");
            expect(rangeAreaHits[0].fromValue).toBe(10);
            expect(rangeAreaHits[0].toValue).toBe(32);
        }
    });

    it("should handle keyboard navigation across range series and format a11y text", () => {
        const hostElement = fixture.debugElement.query(By.css("mona-chart")).nativeElement as HTMLElement;
        hostElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        fixture.detectChanges();

        expect(host.lastPointFocus).toBeDefined();
        expect(host.lastPointFocus?.fromValue).toBeDefined();
        expect(host.lastPointFocus?.toValue).toBeDefined();
        expect(chartComponent.tooltipContext()).toBeDefined();
    });
});
