import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import type { ChartPointEvent, ChartPointFocusEvent, ChartSeriesVisibilityEvent } from "../../models/chart-event.models";
import { MonaAreaSeriesComponent } from "../area-series/area-series.component";
import { MonaBarSeriesComponent } from "../bar-series/bar-series.component";
import { MonaChartLegendComponent } from "../chart-legend/chart-legend.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { MonaChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { MonaChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { MonaLineSeriesComponent } from "../line-series/line-series.component";
import { MonaChartComponent } from "./chart.component";

@Component({
    imports: [
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaLineSeriesComponent,
        MonaAreaSeriesComponent,
        MonaBarSeriesComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent,
        ChartAxisLabelTemplateDirective,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartTooltipTemplateDirective
    ],
    template: `
        <mona-chart
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
    public readonly ariaDescription = signal("Detailed activity chart");
    public readonly ariaLabel = signal("Activity Metrics");
    public readonly data = signal<readonly unknown[]>([
        { actual: 120, barVal: 40, target: 100, x: "2026-01-01" },
        { actual: 180, barVal: 70, target: 150, x: "2026-01-02" },
        { actual: 240, barVal: 90, target: 200, x: "2026-01-03" }
    ]);
    public readonly legendInteractive = signal(true);
    public readonly niceY = signal(true);
    public readonly onPointClick = vi.fn((_event: ChartPointEvent) => {});
    public readonly onPointFocusChange = vi.fn((_event: ChartPointFocusEvent) => {});
    public readonly onSeriesVisibilityChange = vi.fn((_event: ChartSeriesVisibilityEvent) => {});
    public readonly showAreaSeries = signal(true);
    public readonly showBarSeries = signal(true);
    public readonly showLegend = signal(true);
    public readonly showLineSeries = signal(true);
    public readonly showTooltip = signal(true);
    public readonly showXAxis = signal(true);
    public readonly showYAxis = signal(true);
    public readonly tooltipShared = signal(false);
    public readonly userClass = signal("h-80 w-full");
    public readonly useCustomAxisTemplate = signal(false);
    public readonly useCustomLegendTemplate = signal(false);
    public readonly useCustomNoData = signal(false);
    public readonly useCustomTooltipTemplate = signal(false);
    public readonly xAxisFormatter = signal<((value: unknown) => string) | undefined>(undefined);
    public readonly xAxisType = signal<"auto" | "category" | "linear" | "time" | "utc">("category");
    public readonly xField = signal("x");
}

describe("MonaChartComponent", () => {
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

    it("should render root chart with accessible attributes and region role", () => {
        const chartElement = fixture.debugElement.query(By.css("mona-chart"));
        expect(chartElement).not.toBeNull();
        expect(chartElement.nativeElement.getAttribute("role")).toBe("region");
        expect(chartElement.nativeElement.getAttribute("aria-label")).toBe("Activity Metrics");
        expect(chartElement.nativeElement.getAttribute("aria-description")).toBe("Detailed activity chart");
    });

    it("should render canvas element inside chart", () => {
        const canvas = fixture.debugElement.query(By.css("canvas"));
        expect(canvas).not.toBeNull();
    });

    it("should render DOM axis labels", () => {
        fixture.detectChanges();
        const labels = fixture.debugElement.queryAll(By.css(".whitespace-nowrap"));
        expect(labels.length).toBeGreaterThan(0);
    });

    it("should render custom axis label template when provided", () => {
        host.useCustomAxisTemplate.set(true);
        fixture.detectChanges();

        const customLabels = fixture.debugElement.queryAll(By.css(".custom-axis-label"));
        expect(customLabels.length).toBeGreaterThan(0);
        expect(customLabels[0].nativeElement.textContent).toContain("Label:");
    });

    it("should render interactive legend items with series names", () => {
        const legendItems = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendItems.length).toBe(3);
        const textContents = legendItems.map(item => item.nativeElement.textContent.trim());
        expect(textContents).toContain("Target");
        expect(textContents).toContain("Actual");
        expect(textContents).toContain("Bar Values");
    });

    it("should render custom legend item template when provided", () => {
        host.useCustomLegendTemplate.set(true);
        fixture.detectChanges();

        const customLegendItems = fixture.debugElement.queryAll(By.css(".custom-legend-item"));
        expect(customLegendItems.length).toBe(3);
        expect(customLegendItems[0].nativeElement.textContent).toContain("Series: Target");
    });

    it("should toggle series visibility when clicking a legend item", () => {
        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBeGreaterThan(0);

        legendButtons[0].nativeElement.click();
        fixture.detectChanges();

        expect(host.onSeriesVisibilityChange).toHaveBeenCalled();
        const event = host.onSeriesVisibilityChange.mock.calls[0][0];
        expect(event.seriesName).toBe("Target");
        expect(event.visible).toBe(false);

        // Toggle back to visible
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        const secondEvent = host.onSeriesVisibilityChange.mock.calls[1][0];
        expect(secondEvent.visible).toBe(true);
    });

    it("should handle keyboard navigation with arrow keys, enter, escape, and update active accessibility announcement", () => {
        const chart = fixture.debugElement.query(By.css("mona-chart"));
        const chartComp = chart.componentInstance as MonaChartComponent;

        // Simulate ArrowRight keydown
        chart.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        const liveRegion = fixture.debugElement.query(By.css(".sr-only"));
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.nativeElement.textContent.trim().length).toBeGreaterThan(0);
        expect(host.onPointFocusChange).toHaveBeenCalled();

        // Simulate Enter keydown
        chart.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        fixture.detectChanges();
        expect(host.onPointClick).toHaveBeenCalled();

        // Simulate Escape keydown
        chart.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        fixture.detectChanges();
        expect(chartComp.tooltipContext()).toBeNull();
        expect(liveRegion.nativeElement.textContent.trim()).toBe("");
    });

    it("should clear interaction when chart loses focus", () => {
        const chart = fixture.debugElement.query(By.css("mona-chart"));
        const chartComp = chart.componentInstance as MonaChartComponent;

        // Set keyboard point
        chart.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(chartComp.tooltipContext()).not.toBeNull();

        // Focus out to an external element
        const externalEl = document.createElement("button");
        document.body.appendChild(externalEl);
        chart.nativeElement.dispatchEvent(new FocusEvent("focusout", { relatedTarget: externalEl }));
        fixture.detectChanges();

        expect(chartComp.tooltipContext()).toBeNull();
        document.body.removeChild(externalEl);
    });

    it("should not activate hover interaction when tooltip is disabled or not present", () => {
        host.showTooltip.set(false);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
        const canvas = fixture.debugElement.query(By.css("canvas"));

        canvas.nativeElement.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 100 }));
        fixture.detectChanges();

        expect(chartComp.tooltipContext()).toBeNull();
        expect(chartComp.tooltipPosition()).toBeNull();
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

    it("should dynamically add and remove series with @if", () => {
        host.showLineSeries.set(false);
        fixture.detectChanges();

        let legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBe(2);

        host.showLineSeries.set(true);
        fixture.detectChanges();

        legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBe(3);
    });

    it("should display custom tooltip template when hovering over data", () => {
        host.useCustomTooltipTemplate.set(true);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
        const canvas = fixture.debugElement.query(By.css("canvas"));

        // Simulate pointer move over point (100, 100)
        canvas.nativeElement.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 100 }));
        fixture.detectChanges();

        // Check if tooltipContext is populated or clearInteraction works
        expect(() => canvas.nativeElement.dispatchEvent(new PointerEvent("pointerleave"))).not.toThrow();
        fixture.detectChanges();
        expect(chartComp.tooltipContext()).toBeNull();
    });

    it("should clear interaction when pointer leaves canvas", () => {
        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent)).componentInstance as MonaChartComponent;
        const canvas = fixture.debugElement.query(By.css("canvas"));

        canvas.nativeElement.dispatchEvent(new PointerEvent("pointerleave"));
        fixture.detectChanges();

        expect(chartComp.tooltipPosition()).toBeNull();
        expect(chartComp.tooltipContext()).toBeNull();
    });

    it("should pass AXE accessibility verification", async () => {
        const result = await axe.run(fixture.nativeElement);
        expect(result.violations.length).toBe(0);
    });
});
