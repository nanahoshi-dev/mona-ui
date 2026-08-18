import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { ChartCenterTemplateDirective } from "../../directives/chart-center-template.directive";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { ChartSliceLabelTemplateDirective } from "../../directives/chart-slice-label-template.directive";
import { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import type { ChartAnimationInput } from "../../models/chart-animation.models";
import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type {
    ChartPointEvent,
    ChartPointFocusEvent,
    ChartSeriesVisibilityEvent
} from "../../models/chart-event.models";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { DonutSeriesComponent } from "../donut-series/donut-series.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { ChartComponent } from "./chart.component";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        AreaSeriesComponent,
        BarSeriesComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartAxisLabelTemplateDirective,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartTooltipTemplateDirective
    ],
    template: `
        <mona-chart
            [animation]="animation()"
            [data]="data()"
            [xField]="xField()"
            [aria-label]="ariaLabel()"
            [aria-description]="ariaDescription()"
            [class]="userClass()"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)"
            (seriesVisibilityChange)="onSeriesVisibilityChange($event)">
            @if (showXAxis()) {
                <mona-chart-x-axis [type]="xAxisType()" [formatter]="xAxisFormatter()">
                    @if (useCustomAxisTemplate()) {
                        <ng-template monaChartAxisLabelTemplate let-value>
                            <span class="custom-axis-label">Label: {{ value }}</span>
                        </ng-template>
                    }
                </mona-chart-x-axis>
            }
            @if (showYAxis()) {
                <mona-chart-y-axis [nice]="niceY()" />
            }

            @if (showLineSeries()) {
                <mona-line-series field="target" name="Target" curve="monotone-x" [showPoints]="true" />
            }
            @if (showAreaSeries()) {
                <mona-area-series field="actual" name="Actual" fillMode="gradient" />
            }
            @if (showBarSeries()) {
                <mona-bar-series field="barVal" name="Bar Values" />
            }

            @if (showLegend()) {
                <mona-chart-legend [interactive]="legendInteractive()">
                    @if (useCustomLegendTemplate()) {
                        <ng-template monaChartLegendItemTemplate let-series>
                            <span class="custom-legend-item">Series: {{ series.name }}</span>
                        </ng-template>
                    }
                </mona-chart-legend>
            }
            @if (showTooltip()) {
                <mona-chart-tooltip [shared]="tooltipShared()">
                    @if (useCustomTooltipTemplate()) {
                        <ng-template monaChartTooltipTemplate let-point>
                            <div class="custom-tooltip">{{ point.seriesName }}: {{ point.formattedY }}</div>
                        </ng-template>
                    }
                </mona-chart-tooltip>
            }

            @if (useCustomNoData()) {
                <ng-template monaChartNoDataTemplate>
                    <div class="custom-no-data">Custom empty state</div>
                </ng-template>
            }
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly animation = signal<ChartAnimationInput>(false);
    public readonly ariaDescription = signal("Detailed activity chart");
    public readonly ariaLabel = signal("Activity Metrics");
    public readonly data = signal<readonly unknown[]>([
        { actual: 120, barVal: 40, target: 100, x: "2026-01-01" },
        { actual: 180, barVal: 70, target: 150, x: "2026-01-02" },
        { actual: 140, barVal: 55, target: 130, x: "2026-01-03" }
    ]);
    public readonly legendInteractive = signal(true);
    public readonly niceY = signal(true);
    public readonly showAreaSeries = signal(true);
    public readonly showBarSeries = signal(true);
    public readonly showLegend = signal(true);
    public readonly showLineSeries = signal(true);
    public readonly showTooltip = signal(true);
    public readonly showXAxis = signal(true);
    public readonly showYAxis = signal(true);
    public readonly tooltipShared = signal(false);
    public readonly userClass = signal("");
    public readonly useCustomAxisTemplate = signal(false);
    public readonly useCustomLegendTemplate = signal(false);
    public readonly useCustomNoData = signal(false);
    public readonly useCustomTooltipTemplate = signal(false);
    public readonly xAxisFormatter = signal<ChartAxisFormatter | undefined>(undefined);
    public readonly xAxisType = signal<ChartXAxisType>("category");
    public readonly xField = signal("x");

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;
    public lastVisibilityChange: ChartSeriesVisibilityEvent | null = null;

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

@Component({
    imports: [
        ChartComponent,
        PieSeriesComponent,
        DonutSeriesComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartCenterTemplateDirective,
        ChartSliceLabelTemplateDirective
    ],
    template: `
        <mona-chart
            [data]="data()"
            aria-label="Browser distribution"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)">
            @if (isDonut()) {
                <mona-donut-series field="share" categoryField="browser" [innerRadiusRatio]="0.6" [showLabels]="true">
                    <ng-template monaChartCenterTemplate let-formattedTotal="formattedTotal">
                        <div class="test-center">{{ formattedTotal }}</div>
                    </ng-template>
                </mona-donut-series>
            } @else {
                <mona-pie-series field="share" categoryField="browser" [showLabels]="true">
                    <ng-template monaChartSliceLabelTemplate let-slice>
                        <span class="test-slice-label">{{ slice.formattedPercentage }}</span>
                    </ng-template>
                </mona-pie-series>
            }
            <mona-chart-legend />
            <mona-chart-tooltip />
        </mona-chart>
    `
})
class TestPolarHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { browser: "Chrome", share: 60 },
        { browser: "Safari", share: 25 },
        { browser: "Firefox", share: 15 }
    ]);
    public readonly isDonut = signal(false);

    public lastClick: ChartPointEvent | null = null;
    public lastFocus: ChartPointFocusEvent | null = null;

    public onPointClick(e: ChartPointEvent): void {
        this.lastClick = e;
    }

    public onPointFocusChange(e: ChartPointFocusEvent): void {
        this.lastFocus = e;
    }
}

describe("MonaChartComponent", () => {
    describe("Cartesian Chart", () => {
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

        it("should create chart with canvas and aria attributes", () => {
            const chartEl = fixture.debugElement.query(By.directive(ChartComponent));
            expect(chartEl).not.toBeNull();
            expect(chartEl.nativeElement.getAttribute("role")).toBe("region");
            expect(chartEl.nativeElement.getAttribute("aria-label")).toBe("Activity Metrics");
            expect(chartEl.nativeElement.getAttribute("aria-description")).toBe("Detailed activity chart");
            expect(chartEl.nativeElement.getAttribute("tabindex")).toBe("0");

            const canvas = chartEl.query(By.css("canvas"));
            expect(canvas).not.toBeNull();
        });

        it("should render axis labels from dataset", () => {
            const xLabels = fixture.debugElement.queryAll(By.css("mona-chart div > div.absolute"));
            expect(xLabels.length).toBeGreaterThan(0);
        });

        it("should toggle series visibility and emit event", () => {
            const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
            expect(legendButtons.length).toBe(3);

            legendButtons[0].nativeElement.click();
            fixture.detectChanges();

            expect(host.lastVisibilityChange).not.toBeNull();
            expect(host.lastVisibilityChange?.seriesName).toBe("Target");
            expect(host.lastVisibilityChange?.visible).toBe(false);
        });

        it("should handle keyboard navigation using ArrowRight / ArrowLeft / Enter", () => {
            const chartEl = fixture.debugElement.query(By.directive(ChartComponent));

            // Press ArrowRight
            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
            fixture.detectChanges();

            expect(host.lastPointFocus).not.toBeNull();

            // Press Enter to trigger click
            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            fixture.detectChanges();

            expect(host.lastPointClick).not.toBeNull();
        });

        it("should display default no-data state when dataset is empty", () => {
            host.data.set([]);
            host.showLineSeries.set(false);
            host.showAreaSeries.set(false);
            host.showBarSeries.set(false);
            fixture.detectChanges();

            const noData = fixture.debugElement.query(By.css("mona-chart div"));
            expect(noData.nativeElement.textContent).toContain("No data available");
        });

        it("should display custom no-data template when provided and dataset is empty", () => {
            host.data.set([]);
            host.showLineSeries.set(false);
            host.showAreaSeries.set(false);
            host.showBarSeries.set(false);
            host.useCustomNoData.set(true);
            fixture.detectChanges();

            const custom = fixture.debugElement.query(By.css(".custom-no-data"));
            expect(custom).not.toBeNull();
            expect(custom.nativeElement.textContent).toBe("Custom empty state");
        });

        it("should pass AXE accessibility verification", async () => {
            const result = await axe.run(fixture.nativeElement);
            expect(result.violations.length).toBe(0);
        });
    });

    describe("Polar Chart (Pie & Donut)", () => {
        let fixture: ComponentFixture<TestPolarHostComponent>;
        let host: TestPolarHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestPolarHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestPolarHostComponent);
            host = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should render polar pie chart scene with slice legend items", () => {
            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            const scene = chartComp.scene();

            expect(scene?.coordinateSystem).toBe("polar");
            expect(scene?.series.length).toBe(1);
            if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
                expect(scene.series[0].slices.length).toBe(3);
            }

            const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
            expect(legendButtons.length).toBe(3);
            expect(legendButtons[0].nativeElement.textContent).toContain("Chrome");
        });

        it("should navigate polar slices with keyboard arrow keys and announce via live region", () => {
            const chartEl = fixture.debugElement.query(By.directive(ChartComponent));

            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
            fixture.detectChanges();

            expect(host.lastFocus).not.toBeNull();
            expect(host.lastFocus?.seriesType).toBe("pie");

            const liveRegion = fixture.debugElement.query(By.css(".sr-only"));
            expect(liveRegion.nativeElement.textContent).toContain("Chrome");

            // Press Enter
            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            fixture.detectChanges();

            expect(host.lastClick).not.toBeNull();
            expect(host.lastClick?.category).toBe("Chrome");
        });

        it("should select last slice on initial ArrowLeft or ArrowUp in polar mode", () => {
            const chartEl = fixture.debugElement.query(By.directive(ChartComponent));

            chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
            fixture.detectChanges();

            expect(host.lastFocus).not.toBeNull();
            expect(host.lastFocus?.category).toBe("Firefox");
        });

        it("should render donut chart with center template", () => {
            host.isDonut.set(true);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            expect(chartComp.scene()?.series[0].type).toBe("donut");

            const centerEl = fixture.debugElement.query(By.css(".test-center"));
            expect(centerEl).not.toBeNull();
            expect(centerEl.nativeElement.textContent).toContain("100");
        });

        it("should pass AXE accessibility verification on polar chart", async () => {
            const result = await axe.run(fixture.nativeElement);
            expect(result.violations.length).toBe(0);
        });
    });
});
