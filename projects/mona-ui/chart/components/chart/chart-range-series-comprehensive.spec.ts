import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type {
    ChartPointEvent,
    ChartPointFocusEvent,
    ChartSeriesVisibilityEvent
} from "../../models/chart-event.models";
import { ChartComponent } from "./chart.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { RangeBarSeriesComponent } from "../range-bar-series/range-bar-series.component";
import { RangeAreaSeriesComponent } from "../range-area-series/range-area-series.component";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartTooltipComponent,
        ChartLegendComponent,
        RangeBarSeriesComponent,
        RangeAreaSeriesComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'category'"
            [animation]="false"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)"
            (seriesVisibilityChange)="onSeriesVisibilityChange($event)">
            <mona-chart-x-axis [type]="'category'" />
            <mona-chart-y-axis [nice]="true" />
            <mona-chart-legend [interactive]="true" />
            <mona-chart-tooltip [shared]="sharedTooltip()" />

            <mona-range-bar-series
                [(visible)]="rangeBarVisible"
                [fromField]="'minVal'"
                [toField]="'maxVal'"
                [name]="'Tolerance Range'"
                [borderRadius]="borderRadius()"
                [color]="'#3b82f6'"
                [valueFormatter]="rangeFormatter" />

            <mona-range-area-series
                [(visible)]="rangeAreaVisible"
                [fromField]="'fromVal'"
                [toField]="'toVal'"
                [name]="'Confidence Band'"
                [color]="'#10b981'"
                [showPoints]="showPoints()"
                [curve]="'monotone-x'"
                [valueFormatter]="rangeFormatter" />
        </mona-chart>
    `
})
class ComprehensiveRangeHostComponent {
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { category: "A", fromVal: 10, maxVal: 50, minVal: 20, toVal: 40 },
        { category: "B", fromVal: 35, maxVal: 30, minVal: 30, toVal: 25 }, // zero-length bar (30-30) and crossing area (35->25)
        { category: "C", fromVal: null, maxVal: 60, minVal: 15, toVal: null }, // null range area
        { category: "D", fromVal: 20, maxVal: 45, minVal: 25, toVal: 50 }
    ]);
    public readonly sharedTooltip = signal<boolean>(false);
    public readonly rangeBarVisible = signal<boolean>(true);
    public readonly rangeAreaVisible = signal<boolean>(true);
    public readonly showPoints = signal<boolean>(true);
    public readonly borderRadius = signal<number>(6);

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;
    public lastVisibilityChange: ChartSeriesVisibilityEvent | null = null;

    public readonly rangeFormatter = (val: unknown): string => `${val} mm`;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.lastPointFocus = event;
    }

    public onSeriesVisibilityChange(event: ChartSeriesVisibilityEvent): void {
        this.lastVisibilityChange = event;
    }
}

describe("Comprehensive Range Chart Features", () => {
    let fixture: ComponentFixture<ComprehensiveRangeHostComponent>;
    let host: ComprehensiveRangeHostComponent;
    let chartComponent: ChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ComprehensiveRangeHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ComprehensiveRangeHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        chartComponent = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance;
    });

    it("should compute scene with zero-length range bar and crossing range area (RNG-001, RNG-004)", () => {
        const scene = chartComponent.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            const rangeBar = scene.series.find(s => s.type === "rangeBar");
            const rangeArea = scene.series.find(s => s.type === "rangeArea");

            expect(rangeBar).toBeDefined();
            expect(rangeArea).toBeDefined();

            if (rangeBar && rangeBar.type === "rangeBar") {
                expect(rangeBar.bars.length).toBe(4);
                // Zero-length bar at index 1
                expect(rangeBar.bars[1].height).toBe(0);
                expect(rangeBar.bars[1].fromValue).toBe(30);
                expect(rangeBar.bars[1].toValue).toBe(30);
                expect(rangeBar.bars[0].cornerRadii).toEqual({
                    bottomLeft: 6,
                    bottomRight: 6,
                    topLeft: 6,
                    topRight: 6
                });
            }

            if (rangeArea && rangeArea.type === "rangeArea") {
                expect(rangeArea.points.length).toBe(4);
                // Crossing point at index 1: fromVal 35, toVal 25
                expect(rangeArea.points[1].fromValue).toBe(35);
                expect(rangeArea.points[1].toValue).toBe(25);
                expect(rangeArea.points[1].lowValue).toBe(25);
                expect(rangeArea.points[1].highValue).toBe(35);
                // Null point at index 2
                expect(rangeArea.points[2].defined).toBe(false);
            }
        }
    });

    it("should render legend items and toggle series visibility", () => {
        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBe(2);

        // Click first legend item (Range Bar) to hide it
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();

        expect(host.lastVisibilityChange).not.toBeNull();
        expect(host.lastVisibilityChange?.seriesName).toBe("Tolerance Range");
        expect(host.lastVisibilityChange?.visible).toBe(false);
        expect(host.rangeBarVisible()).toBe(false);
    });

    it("should handle keyboard navigation and emit formatted a11y values", () => {
        const chartEl = fixture.debugElement.query(By.directive(ChartComponent));
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();

        expect(host.lastPointFocus).toBeDefined();
        expect(host.lastPointFocus?.valueKind).toBe("range");
        expect(host.lastPointFocus?.formattedFrom).toContain("mm");
        expect(host.lastPointFocus?.formattedTo).toContain("mm");
    });
});
