import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartAxisLabelRotation, ChartHeaderAlignment } from "../models/chart-axis.models";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartTitleTemplateDirective } from "../directives/chart-title-template.directive";
import { ChartSubtitleTemplateDirective } from "../directives/chart-subtitle-template.directive";
import type { CartesianXYChartScene } from "../internal/scene/chart-scene";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        BarSeriesComponent,
        ChartTitleTemplateDirective,
        ChartSubtitleTemplateDirective
    ],
    template: `
        <div style="width: 600px; height: 400px;">
            <mona-chart
                [data]="data()"
                [xField]="'category'"
                [title]="title()"
                [subtitle]="subtitle()"
                [titleAlign]="titleAlign()"
                [ariaLabel]="ariaLabel()"
                [ariaDescription]="ariaDescription()">
                <mona-chart-x-axis
                    [labels]="xLabels()"
                    [labelRotation]="xLabelRotation()"
                    [labelMaxWidth]="xLabelMaxWidth()"
                    [tickMarks]="xTickMarks()"
                    [tickSize]="xTickSize()"
                    [title]="xAxisTitle()"
                    [titlePadding]="xTitlePadding()" />
                <mona-chart-y-axis
                    [labels]="yLabels()"
                    [labelRotation]="yLabelRotation()"
                    [tickMarks]="yTickMarks()"
                    [tickSize]="yTickSize()"
                    [title]="yAxisTitle()" />

                <mona-bar-series [field]="'revenue'" [name]="'Revenue'" />

                @if (useCustomTitleTemplate()) {
                    <ng-template monaChartTitleTemplate let-titleText>
                        <span class="custom-title-class">{{ titleText }} (Custom)</span>
                    </ng-template>
                }

                @if (useCustomSubtitleTemplate()) {
                    <ng-template monaChartSubtitleTemplate let-subtitleText>
                        <span class="custom-subtitle-class">{{ subtitleText }} (Custom)</span>
                    </ng-template>
                }
            </mona-chart>
        </div>
    `
})
class TestAxisPresentationHostComponent {
    public readonly ariaDescription = signal<string>("");
    public readonly ariaLabel = signal<string>("");
    public readonly data = signal<readonly unknown[]>([
        { category: "Alpha", revenue: 100 },
        { category: "Beta", revenue: 200 },
        { category: "Gamma", revenue: 300 }
    ]);
    public readonly subtitle = signal<string>("Chart Subtitle Description");
    public readonly title = signal<string>("Chart Main Title");
    public readonly titleAlign = signal<ChartHeaderAlignment>("left");
    public readonly useCustomSubtitleTemplate = signal<boolean>(false);
    public readonly useCustomTitleTemplate = signal<boolean>(false);
    public readonly xAxisTitle = signal<string>("X Axis Category");
    public readonly xLabelMaxWidth = signal<number | undefined>(undefined);
    public readonly xLabelRotation = signal<ChartAxisLabelRotation>(0);
    public readonly xLabels = signal<boolean>(true);
    public readonly xTickMarks = signal<boolean>(false);
    public readonly xTickSize = signal<number>(6);
    public readonly xTitlePadding = signal<number>(8);
    public readonly yAxisTitle = signal<string>("Y Axis Revenue");
    public readonly yLabelRotation = signal<ChartAxisLabelRotation>(0);
    public readonly yLabels = signal<boolean>(true);
    public readonly yTickMarks = signal<boolean>(false);
    public readonly yTickSize = signal<number>(6);
}

describe("Chart Axis Presentation & Header Layout", () => {
    let fixture: ComponentFixture<TestAxisPresentationHostComponent>;
    let host: TestAxisPresentationHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestAxisPresentationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestAxisPresentationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("renders title and subtitle header above the plot container", () => {
        const titleEl = fixture.debugElement.query(By.css("div.font-semibold"));
        expect(titleEl).not.toBeNull();
        expect(titleEl.nativeElement.textContent).toContain("Chart Main Title");

        const subtitleEl = fixture.debugElement.query(By.css("div.text-xs.text-muted-foreground, div.text-xs"));
        expect(subtitleEl).not.toBeNull();
        expect(subtitleEl.nativeElement.textContent).toContain("Chart Subtitle Description");
    });

    it("applies header text alignment classes correctly", () => {
        host.titleAlign.set("center");
        fixture.detectChanges();

        const headerEl = fixture.debugElement.query(By.css(".mona-chart-header, div.flex.flex-col"));
        expect(headerEl.nativeElement.className).toContain("items-center");

        host.titleAlign.set("right");
        fixture.detectChanges();
        expect(headerEl.nativeElement.className).toContain("items-end");
    });

    it("uses title and subtitle as accessible ARIA fallbacks when aria-label is omitted", () => {
        const chartEl = fixture.debugElement.query(By.directive(ChartComponent)).nativeElement as HTMLElement;
        expect(chartEl.getAttribute("aria-label")).toBe("Chart Main Title");
        expect(chartEl.getAttribute("aria-description")).toBe("Chart Subtitle Description");
    });

    it("prefers explicit aria-label and aria-description over title and subtitle", () => {
        host.ariaLabel.set("Explicit Label");
        host.ariaDescription.set("Explicit Description");
        fixture.detectChanges();

        const chartEl = fixture.debugElement.query(By.directive(ChartComponent)).nativeElement as HTMLElement;
        expect(chartEl.getAttribute("aria-label")).toBe("Explicit Label");
        expect(chartEl.getAttribute("aria-description")).toBe("Explicit Description");
    });

    it("projects custom title and subtitle templates via directives", () => {
        host.useCustomTitleTemplate.set(true);
        host.useCustomSubtitleTemplate.set(true);
        fixture.detectChanges();

        const customTitle = fixture.debugElement.query(By.css(".custom-title-class"));
        expect(customTitle).not.toBeNull();
        expect(customTitle.nativeElement.textContent).toContain("Chart Main Title (Custom)");

        const customSubtitle = fixture.debugElement.query(By.css(".custom-subtitle-class"));
        expect(customSubtitle).not.toBeNull();
        expect(customSubtitle.nativeElement.textContent).toContain("Chart Subtitle Description (Custom)");
    });

    it("supports toggling axis labels visibility via labels input", () => {
        host.xLabels.set(false);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;
        const xAxisScene = scene?.axes.find(a => a.axis === "x");
        expect(xAxisScene?.labels).toBe(false);
    });

    it("applies label rotation and max-width in Cartesian layout engine", () => {
        host.xLabelRotation.set(45);
        host.xLabelMaxWidth.set(80);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;
        const xAxisScene = scene?.axes.find(a => a.axis === "x");

        expect(xAxisScene?.labelRotation).toBe(45);
        expect(xAxisScene?.labelMaxWidth).toBe(80);
    });

    it("passes tickMarks and tickSize presentation inputs to axis scenes", () => {
        host.xTickMarks.set(true);
        host.xTickSize.set(8);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;
        const xAxisScene = scene?.axes.find(a => a.axis === "x");

        expect(xAxisScene?.tickMarks).toBe(true);
        expect(xAxisScene?.tickSize).toBe(8);
    });

    it("applies Y-axis label rotation and DOM transforms correctly", () => {
        host.yLabelRotation.set(90);
        fixture.detectChanges();

        const chartCmp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartCmp.scene() as CartesianXYChartScene;
        const yAxisScene = scene.axes.find(a => a.axis === "y")!;

        expect(yAxisScene?.labelRotation).toBe(90);
        expect(yAxisScene.ticks.length).toBeGreaterThan(0);

        // Verify transform and origin for 90deg rotation
        const transform = chartCmp["axisLabelTransform"](yAxisScene, yAxisScene.ticks[0]);
        expect(transform).toBe("translate(-100%, -50%) rotate(90deg)");

        const origin = chartCmp["axisLabelTransformOrigin"](yAxisScene);
        expect(origin).toBe("right center");
    });
});
