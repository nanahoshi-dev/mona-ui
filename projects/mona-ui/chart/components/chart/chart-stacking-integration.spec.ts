import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import type { ChartPointEvent } from "../../models/chart-event.models";
import type { CartesianChartScene } from "../../internal/scene/chart-scene";
import type { ChartAreaSeriesScene, ChartAxisScene, ChartBarSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartLegendComponent,
        ChartTooltipComponent
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
    imports: [ChartComponent, BarSeriesComponent, ChartXAxisComponent, ChartYAxisComponent, ChartLegendComponent],
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
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartLegendComponent,
        ChartTooltipComponent
    ],
    template: `
        <mona-chart [data]="data()" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis field="month" type="category" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-chart-tooltip />
            <mona-bar-series
                [(visible)]="s1Visible"
                field="s1"
                name="Series 1"
                stack="pct"
                stackMode="percent"
                [borderRadius]="5" />
            <mona-bar-series
                [(visible)]="s2Visible"
                field="s2"
                name="Series 2"
                stack="pct"
                stackMode="percent"
                [borderRadius]="5" />
        </mona-chart>
    `
})
class PercentStackedBarTestComponent {
    public readonly data = signal([
        { month: "Jan", s1: 25, s2: 75 },
        { month: "Feb", s1: 50, s2: 50 }
    ]);
    public s1Visible = signal(true);
    public s2Visible = signal(true);
}

@Component({
    imports: [ChartComponent, AreaSeriesComponent, ChartXAxisComponent, ChartYAxisComponent, ChartLegendComponent],
    template: `
        <mona-chart [data]="data()" xField="year" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis type="linear" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-area-series field="desktop" name="Desktop" stack="traffic" fillMode="solid" />
            <mona-area-series field="mobile" name="Mobile" stack="traffic" fillMode="solid" />
        </mona-chart>
    `
})
class StackedAreaTestComponent {
    public readonly data = signal([
        { desktop: 100, mobile: 50, year: 2020 },
        { desktop: 120, mobile: 80, year: 2021 },
        { desktop: 110, mobile: 110, year: 2022 }
    ]);
}

@Component({
    imports: [ChartComponent, AreaSeriesComponent, ChartXAxisComponent, ChartYAxisComponent, ChartLegendComponent],
    template: `
        <mona-chart [data]="data()" xField="year" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis type="linear" />
            <mona-chart-y-axis />
            <mona-chart-legend />
            <mona-area-series field="desktop" name="Desktop" stack="traffic" stackMode="percent" fillMode="solid" />
            <mona-area-series field="mobile" name="Mobile" stack="traffic" stackMode="percent" fillMode="solid" />
        </mona-chart>
    `
})
class PercentStackedAreaTestComponent {
    public readonly data = signal([
        { desktop: 1000, mobile: 1000, year: 2020 },
        { desktop: 1500, mobile: 500, year: 2021 }
    ]);
}

@Component({
    imports: [ChartComponent, AreaSeriesComponent, ChartXAxisComponent, ChartYAxisComponent],
    template: `
        <mona-chart [data]="[]" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis type="linear" />
            <mona-chart-y-axis />
            <mona-area-series [data]="series1Data" field="y" xField="x" stack="flow" />
            <mona-area-series [data]="series2Data" field="y" xField="x" stack="flow" />
        </mona-chart>
    `
})
class StackedAreaLatticeTestComponent {
    public series1Data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 }
    ];
    public series2Data = [
        { x: 1, y: 5 },
        { x: 3, y: 15 } // missing x: 2
    ];
}

describe("Cartesian Stacking Integration", () => {
    describe("Stacked Bar Series", () => {
        let fixture: ComponentFixture<StackedBarTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [StackedBarTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(StackedBarTestComponent);
            fixture.detectChanges();
        });

        it("should render stacked bars in declaration order with cumulative positions", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene).toBeDefined();
            expect(scene.series.length).toBe(3);

            const online = scene.series[0] as ChartBarSeriesScene;
            const retail = scene.series[1] as ChartBarSeriesScene;
            const partner = scene.series[2] as ChartBarSeriesScene;

            // Jan: online=20 (0->20), retail=30 (20->50), partner=10 (50->60)
            const oJan = online.bars[0];
            const rJan = retail.bars[0];
            const pJan = partner.bars[0];

            expect(oJan.stackStartValue).toBe(0);
            expect(oJan.stackEndValue).toBe(20);
            expect(oJan.stackPosition).toBe("inner");

            expect(rJan.stackStartValue).toBe(20);
            expect(rJan.stackEndValue).toBe(50);
            expect(rJan.stackPosition).toBe("inner");

            expect(pJan.stackStartValue).toBe(50);
            expect(pJan.stackEndValue).toBe(60);
            expect(pJan.stackPosition).toBe("outer"); // Top-most positive segment

            // Partner bar has rounded top corners
            expect(pJan.cornerRadii?.topLeft).toBe(6);
            expect(pJan.cornerRadii?.topRight).toBe(6);
            expect(pJan.cornerRadii?.bottomLeft).toBe(0);
            expect(pJan.cornerRadii?.bottomRight).toBe(0);

            // Online and Retail have 0 corner radius (inner segments)
            expect(oJan.cornerRadii?.topLeft).toBe(0);
            expect(rJan.cornerRadii?.topLeft).toBe(0);
        });

        it("should align category tick coordinates with the center of stacked bars (Bug 2)", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;
            const xAxisScene = scene.axes.find(a => a.axis === "x")!;
            const online = scene.series[0] as ChartBarSeriesScene;

            expect(xAxisScene).toBeDefined();
            expect(xAxisScene.ticks.length).toBe(2);

            // Jan tick aligns with center of Jan bar
            const janTick = xAxisScene.ticks[0];
            const janBar = online.bars[0];
            const janBarCenter = janBar.x + janBar.width / 2;
            expect(janTick.coordinate).toBeCloseTo(janBarCenter, 1);

            // Feb tick aligns with center of Feb bar
            const febTick = xAxisScene.ticks[1];
            const febBar = online.bars[1];
            const febBarCenter = febBar.x + febBar.width / 2;
            expect(febTick.coordinate).toBeCloseTo(febBarCenter, 1);
        });

        it("should preserve stable plotRect across layout recomputations (Bug 1)", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const initialScene = chartComp.scene() as CartesianChartScene;
            const initialPlotX = initialScene.plotRect.x;
            const initialPlotY = initialScene.plotRect.y;
            const initialPlotW = initialScene.plotRect.width;
            const initialPlotH = initialScene.plotRect.height;

            // Recompute scene (e.g. triggered post-animation or layout pass)
            chartComp.recomputeScene();
            const recomputedScene = chartComp.scene() as CartesianChartScene;

            expect(recomputedScene.plotRect.x).toBe(initialPlotX);
            expect(recomputedScene.plotRect.y).toBe(initialPlotY);
            expect(recomputedScene.plotRect.width).toBe(initialPlotW);
            expect(recomputedScene.plotRect.height).toBe(initialPlotH);
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

        it("should allocate separate horizontal slots for different stack groups and standalone series", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            const pA = (scene.series[0] as ChartBarSeriesScene).bars[0]; // hardware
            const pB = (scene.series[1] as ChartBarSeriesScene).bars[0]; // hardware
            const sA = (scene.series[2] as ChartBarSeriesScene).bars[0]; // services
            const target = (scene.series[4] as ChartBarSeriesScene).bars[0]; // standalone

            // pA and pB share the same X position (hardware stack slot)
            expect(pA.x).toBe(pB.x);

            // sA has a different X position (services stack slot)
            expect(sA.x).toBeGreaterThan(pA.x);

            // target has a different X position (target standalone slot)
            expect(target.x).toBeGreaterThan(sA.x);
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
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
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
            expect(yAxisScene?.ticks.some((t: { formattedValue: string }) => t.formattedValue.includes("%"))).toBe(
                true
            );
        });

        it("should maintain [0, 100] domain when all percent members are toggled to hidden (STK-007)", () => {
            const component = fixture.componentInstance;
            component.s1Visible.set(false);
            component.s2Visible.set(false);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;
            const yAxisScene = scene.axes.find((a: ChartAxisScene) => a.axis === "y");

            expect(yAxisScene).toBeDefined();
            expect(yAxisScene?.ticks.some((t: { formattedValue: string }) => t.formattedValue.includes("%"))).toBe(
                true
            );
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
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
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

    describe("100% Percent Stacked Area Series", () => {
        let fixture: ComponentFixture<PercentStackedAreaTestComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [PercentStackedAreaTestComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(PercentStackedAreaTestComponent);
            fixture.detectChanges();
        });

        it("should normalize stacked areas to 100% with domain [0, 100]", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            expect(scene.series.length).toBe(2);

            const desktop = scene.series[0] as ChartAreaSeriesScene;
            const mobile = scene.series[1] as ChartAreaSeriesScene;

            // 2020: desktop=1000, mobile=1000 -> desktop is 50%, mobile is 50% (reaches 100%)
            const d2020 = desktop.points[0];
            const m2020 = mobile.points[0];

            expect(d2020.stackPercentage).toBe(50);
            expect(d2020.stackStartValue).toBe(0);
            expect(d2020.stackEndValue).toBe(50);

            expect(m2020.stackPercentage).toBe(50);
            expect(m2020.stackStartValue).toBe(50);
            expect(m2020.stackEndValue).toBe(100);

            // Y axis domain is [0, 100]
            const yAxisScene = scene.axes.find((a: ChartAxisScene) => a.axis === "y");
            expect(yAxisScene).toBeDefined();
            expect(yAxisScene?.ticks.some((t: { formattedValue: string }) => t.formattedValue.includes("%"))).toBe(
                true
            );
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
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene() as CartesianChartScene;

            const a2 = scene.series[1] as ChartAreaSeriesScene;
            expect(a2.points.length).toBe(3);

            // At X=2, A2 has synthetic point
            const a2At2 = a2.points[1];
            expect(a2At2.xValue).toBe(2);
            expect(a2At2.synthetic).toBe(true);
            expect(a2At2.defined).toBe(true);
            expect(a2At2.stackStartValue).toBe(20);
            expect(a2At2.stackEndValue).toBe(20);
        });
    });
});
