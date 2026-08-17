import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it } from "vitest";
import { MonaChartComponent } from "./chart.component";
import { MonaBarSeriesComponent } from "../bar-series/bar-series.component";
import { MonaAreaSeriesComponent } from "../area-series/area-series.component";
import { MonaChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { MonaChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { MonaChartLegendComponent } from "../chart-legend/chart-legend.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import type { ChartPointEvent } from "../../models/chart-event.models";
import type { CartesianChartScene } from "../../internal/scene/chart-scene";
import type { ChartAreaSeriesScene, ChartAxisScene, ChartBarSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [
        MonaChartComponent,
        MonaBarSeriesComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400" (pointClick)="onPointClick($event)">
            <mona-chart-x-axis field="month" type="category" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-chart-tooltip />
            <mona-bar-series field="online" name="Online" stack="sales" [borderRadius]="6" />
            <mona-bar-series field="retail" name="Retail" stack="sales" [borderRadius]="6" />
            <mona-bar-series field="partner" name="Partner" stack="sales" [borderRadius]="6" />
        </mona-chart>
    `
})
class StackedBarTestComponent {
    public readonly data = signal([
        { month: "Jan", online: 20, partner: 10, retail: 30 },
        { month: "Feb", online: 40, partner: 15, retail: 25 }
    ]);
    public lastClickEvent: ChartPointEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastClickEvent = event;
    }
}

@Component({
    imports: [
        MonaChartComponent,
        MonaBarSeriesComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartLegendComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis field="quarter" type="category" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <!-- Stack 1 -->
            <mona-bar-series field="productA" name="Product A" stack="hardware" [borderRadius]="4" />
            <mona-bar-series field="productB" name="Product B" stack="hardware" [borderRadius]="4" />
            <!-- Stack 2 -->
            <mona-bar-series field="serviceA" name="Service A" stack="services" [borderRadius]="4" />
            <mona-bar-series field="serviceB" name="Service B" stack="services" [borderRadius]="4" />
            <!-- Unstacked -->
            <mona-bar-series field="target" name="Target" [borderRadius]="4" />
        </mona-chart>
    `
})
class GroupedStackedBarTestComponent {
    public readonly data = signal([
        { productA: 10, productB: 20, quarter: "Q1", serviceA: 15, serviceB: 25, target: 80 },
        { productA: 30, productB: 15, quarter: "Q2", serviceA: 20, serviceB: 30, target: 100 }
    ]);
}

@Component({
    imports: [
        MonaChartComponent,
        MonaBarSeriesComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartLegendComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis field="month" type="category" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-bar-series field="s1" name="Series 1" stack="pct" stackMode="percent" [borderRadius]="5" />
            <mona-bar-series field="s2" name="Series 2" stack="pct" stackMode="percent" [borderRadius]="5" />
        </mona-chart>
    `
})
class PercentStackedBarTestComponent {
    public readonly data = signal([
        { month: "Jan", s1: 25, s2: 75 },
        { month: "Feb", s1: 50, s2: 50 }
    ]);
}

@Component({
    imports: [
        MonaChartComponent,
        MonaAreaSeriesComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaChartLegendComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis field="year" type="linear" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-area-series field="desktop" name="Desktop" stack="traffic" xField="year" />
            <mona-area-series field="mobile" name="Mobile" stack="traffic" xField="year" />
        </mona-chart>
    `
})
class StackedAreaTestComponent {
    public readonly data = signal([
        { desktop: 100, mobile: 50, year: 2020 },
        { desktop: 120, mobile: 80, year: 2021 },
        { desktop: 140, mobile: 110, year: 2022 }
    ]);
}

@Component({
    imports: [
        MonaChartComponent,
        MonaAreaSeriesComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent
    ],
    template: `
        <mona-chart [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis type="linear" />
            <mona-chart-y-axis />
            <mona-area-series [data]="series1Data()" field="val" name="A1" stack="g" xField="x" />
            <mona-area-series [data]="series2Data()" field="val" name="A2" stack="g" xField="x" />
        </mona-chart>
    `
})
class StackedAreaLatticeTestComponent {
    public readonly series1Data = signal([
        { val: 10, x: 1 },
        { val: 20, x: 2 },
        { val: 30, x: 3 }
    ]);
    public readonly series2Data = signal([
        { val: 5, x: 1 },
        { val: 15, x: 3 }
    ]);
}

describe("Chart Stacking Integration", () => {
    describe("Stacked Bar Series", () => {
        let fixture: ComponentFixture<StackedBarTestComponent>;
        let component: StackedBarTestComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [StackedBarTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(StackedBarTestComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should calculate correct cumulative stacked bar positions and only apply outer corner radii", () => {
            const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene).toBeDefined();
            expect(scene.series.length).toBe(3);

            const series1 = scene.series[0] as ChartBarSeriesScene;
            const series2 = scene.series[1] as ChartBarSeriesScene;
            const series3 = scene.series[2] as ChartBarSeriesScene;

            // Jan: online=20 (0->20), retail=30 (20->50), partner=10 (50->60)
            const s1Jan = series1.bars[0];
            const s2Jan = series2.bars[0];
            const s3Jan = series3.bars[0];

            expect(s1Jan.stackStartValue).toBe(0);
            expect(s1Jan.stackEndValue).toBe(20);
            expect(s1Jan.stackPosition).toBe("inner");
            expect(s1Jan.cornerRadii).toEqual({ bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 });

            expect(s2Jan.stackStartValue).toBe(20);
            expect(s2Jan.stackEndValue).toBe(50);
            expect(s2Jan.stackPosition).toBe("inner");
            expect(s2Jan.cornerRadii).toEqual({ bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 });

            expect(s3Jan.stackStartValue).toBe(50);
            expect(s3Jan.stackEndValue).toBe(60);
            expect(s3Jan.stackPosition).toBe("outer");
            expect(s3Jan.cornerRadii).toEqual({ bottomLeft: 0, bottomRight: 0, topLeft: 6, topRight: 6 });
        });

        it("should emit pointClick event with stack metadata when keyboard Enter is pressed", () => {
            const chartEl = fixture.debugElement.query(By.directive(MonaChartComponent));

            // Navigate to first point
            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
            fixture.detectChanges();

            // Press Enter to trigger click
            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            fixture.detectChanges();

            expect(component.lastClickEvent).toBeDefined();
            expect(component.lastClickEvent?.stackGroup).toBe("sales");
            expect(component.lastClickEvent?.stackMode).toBe("normal");
            expect(component.lastClickEvent?.stackStart).toBeDefined();
            expect(component.lastClickEvent?.stackEnd).toBeDefined();
        });
    });

    describe("Grouped and Stacked Bar Series", () => {
        let fixture: ComponentFixture<GroupedStackedBarTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [GroupedStackedBarTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(GroupedStackedBarTestComponent);
            fixture.detectChanges();
        });

        it("should allocate separate slots for distinct stack groups and unstacked series", () => {
            const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene.series.length).toBe(5);

            // In Q1, hardware stack (A+B) and services stack (A+B) and target should have distinct X coordinates
            const hwBar = (scene.series[0] as ChartBarSeriesScene).bars[0];
            const srvBar = (scene.series[2] as ChartBarSeriesScene).bars[0];
            const targetBar = (scene.series[4] as ChartBarSeriesScene).bars[0];

            expect(hwBar.x).toBeLessThan(srvBar.x);
            expect(srvBar.x).toBeLessThan(targetBar.x);
        });
    });

    describe("100% Percent Stacked Bar Series", () => {
        let fixture: ComponentFixture<PercentStackedBarTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [PercentStackedBarTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(PercentStackedBarTestComponent);
            fixture.detectChanges();
        });

        it("should normalize stacked bars to 100% and format Y-axis with percent ticks", () => {
            const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            const s1Jan = (scene.series[0] as ChartBarSeriesScene).bars[0];
            const s2Jan = (scene.series[1] as ChartBarSeriesScene).bars[0];

            // Jan: s1=25, s2=75 -> s1 is 25%, s2 is 75%
            expect(s1Jan.stackPercentage).toBe(25);
            expect(s1Jan.stackStartValue).toBe(0);
            expect(s1Jan.stackEndValue).toBe(25);

            expect(s2Jan.stackPercentage).toBe(75);
            expect(s2Jan.stackStartValue).toBe(25);
            expect(s2Jan.stackEndValue).toBe(100);

            // Y axis ticks should end with '%'
            const yAxisScene = scene.axes.find((a: ChartAxisScene) => a.axis === "y");
            expect(yAxisScene).toBeDefined();
            expect(yAxisScene?.ticks.some((t: { formattedValue: string }) => t.formattedValue.includes("%"))).toBe(true);
        });
    });

    describe("Stacked Area Series", () => {
        let fixture: ComponentFixture<StackedAreaTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [StackedAreaTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(StackedAreaTestComponent);
            fixture.detectChanges();
        });

        it("should calculate cumulative baseY for each point in stacked Area series", () => {
            const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene.series.length).toBe(2);

            const desktop = scene.series[0] as ChartAreaSeriesScene;
            const mobile = scene.series[1] as ChartAreaSeriesScene;

            // 2020: desktop=100 (0->100), mobile=50 (100->150)
            const d2020 = desktop.points[0];
            const m2020 = mobile.points[0];

            expect(d2020.stackStartValue).toBe(0);
            expect(d2020.stackEndValue).toBe(100);

            expect(m2020.stackStartValue).toBe(100);
            expect(m2020.stackEndValue).toBe(150);

            // mobile baseY corresponds to top of desktop (mobile.baseY === desktop.y)
            expect(m2020.baseY).toBeCloseTo(d2020.y, 1);
        });
    });

    describe("Stacked Area Lattice Synthetic Points", () => {
        let fixture: ComponentFixture<StackedAreaLatticeTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [StackedAreaLatticeTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(StackedAreaLatticeTestComponent);
            fixture.detectChanges();
        });

        it("should align area series lattices with synthetic points for missing X coordinates", () => {
            const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            const a2 = scene.series[1] as ChartAreaSeriesScene;
            expect(a2.points.length).toBe(3);

            // At X=2, A2 has synthetic point
            const a2At2 = a2.points[1];
            expect(a2At2.xValue).toBe(2);
            expect(a2At2.synthetic).toBe(true);
            expect(a2At2.defined).toBe(false);
            expect(a2At2.stackStartValue).toBe(20);
            expect(a2At2.stackEndValue).toBe(20);
        });
    });
});
