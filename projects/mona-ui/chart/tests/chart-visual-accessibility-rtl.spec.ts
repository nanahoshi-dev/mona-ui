import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { wcagContrast } from "culori";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { CandlestickSeriesComponent } from "../components/candlestick-series/candlestick-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartLegendComponent } from "../components/chart-legend/chart-legend.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { HeatmapSeriesComponent } from "../components/heatmap-series/heatmap-series.component";
import { WaterfallSeriesComponent } from "../components/waterfall-series/waterfall-series.component";
import { CHART_DEFAULT_MESSAGES } from "../i18n/chart.default-messages";
import { ChartDataLabelPlacement } from "../internal/data-label/chart-data-label-placement";
import type { NormalizedChartDataLabelOptions } from "../internal/data-label/chart-data-label-options";
import type { ChartScene } from "../internal/scene/chart-scene";
import type { SceneHitTarget } from "../internal/scene/scene-geometry";
import { setChartLocale } from "../internal/utils/chart-locale";
import type { ChartHeaderAlignment, ChartYAxisPosition } from "../models/chart-axis.models";
import type { ChartLegendPosition } from "../models/chart-series.models";

@Component({
    imports: [BarSeriesComponent, ChartComponent, ChartLegendComponent, ChartYAxisComponent],
    template: `
        <mona-chart
            [animation]="false"
            [style.width.px]="600"
            [style.height.px]="400"
            [data]="data"
            xField="x"
            title="Sales"
            [titleAlign]="titleAlign()">
            @if (yPosition(); as position) {
                <mona-chart-y-axis [position]="position" />
                <mona-chart-y-axis axisId="second" [position]="secondYPosition()" />
            }
            <mona-bar-series name="Revenue" field="revenue" />
            <mona-bar-series name="Cost" field="cost" />
            <mona-bar-series name="Tax" field="tax" />
            <mona-bar-series name="Margin" field="margin" />
            <mona-bar-series name="Other" field="other" />
            <mona-chart-legend [position]="legendPosition()" />
        </mona-chart>
    `
})
class FrameHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { cost: 5, margin: 3, other: 1, revenue: 10, tax: 2, x: "A" },
        { cost: 8, margin: 4, other: 2, revenue: 30, tax: 3, x: "B" }
    ];
    public readonly legendPosition = signal<ChartLegendPosition>("bottom");
    public readonly secondYPosition = signal<ChartYAxisPosition>("end");
    public readonly titleAlign = signal<ChartHeaderAlignment>("start");
    public readonly yPosition = signal<ChartYAxisPosition | null>(null);
}

@Component({
    imports: [BarSeriesComponent, ChartComponent],
    template: `
        <div dir="rtl">
            <mona-chart
                #rtl
                [animation]="false"
                [style.width.px]="300"
                [style.height.px]="200"
                [data]="data"
                xField="x">
                <mona-bar-series field="y" />
            </mona-chart>
        </div>
        <div dir="ltr">
            <mona-chart
                #ltr
                [animation]="false"
                [style.width.px]="300"
                [style.height.px]="200"
                [data]="data"
                xField="x">
                <mona-bar-series field="y" />
            </mona-chart>
        </div>
    `
})
class MixedHostComponent {
    public readonly data = [{ x: "A", y: 1 }];
    public readonly ltr = viewChild.required("ltr", { read: ChartComponent });
    public readonly rtl = viewChild.required("rtl", { read: ChartComponent });
}

@Component({
    imports: [ChartComponent, HeatmapSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-heatmap-series field="v" yField="y" name="Activity" />
        </mona-chart>
    `
})
class HeatmapHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { v: 1, x: "A", y: "P" },
        { v: 2, x: "B", y: "Q" }
    ];
}

@Component({
    imports: [ChartComponent, WaterfallSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-waterfall-series name="Cash" field="y" />
        </mona-chart>
    `
})
class WaterfallHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { x: "A", y: 10 },
        { x: "B", y: -4 }
    ];
}

@Component({
    imports: [CandlestickSeriesComponent, ChartComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-candlestick-series name="ACME" openField="o" highField="h" lowField="l" closeField="c" />
        </mona-chart>
    `
})
class CandlestickHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { c: 12, h: 13, l: 9, o: 10, x: "A" },
        { c: 9, h: 13, l: 8, o: 12, x: "B" }
    ];
}

function render<T>(type: new () => T, setup?: (host: T) => void): ComponentFixture<T> {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 400));
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    return fixture;
}

function renderIn<T>(dir: "ltr" | "rtl", type: new () => T, setup?: (host: T) => void): ComponentFixture<T> {
    document.documentElement.setAttribute("dir", dir);
    return render(type, setup);
}

function yAxisSides(chart: ChartComponent): string[] {
    const scene = chart.scene() as ChartScene & { axes: readonly { axis: string; position: string }[] };
    return scene.axes.filter(axis => axis.axis === "y").map(axis => axis.position);
}

function chartHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-chart") as HTMLElement;
}

afterEach(() => {
    document.documentElement.removeAttribute("dir");
    setChartLocale("en-US", CHART_DEFAULT_MESSAGES);
    vi.restoreAllMocks();
});

describe("Chart frame direction", () => {
    it("puts a chart with no Y axis component on the start side", () => {
        expect(yAxisSides(renderIn("ltr", FrameHostComponent).componentInstance.chart())).toEqual(["left"]);
        TestBed.resetTestingModule();
        expect(yAxisSides(renderIn("rtl", FrameHostComponent).componentInstance.chart())).toEqual(["right"]);
    });

    it.each<[ChartYAxisPosition, ChartYAxisPosition, "ltr" | "rtl", string[]]>([
        ["start", "end", "ltr", ["left", "right"]],
        ["start", "end", "rtl", ["right", "left"]],
        ["left", "right", "rtl", ["left", "right"]],
        ["right", "left", "rtl", ["right", "left"]]
    ])("places Y axes %s and %s in %s on the sides %j", (first, second, dir, expected) => {
        const fixture = renderIn(dir, FrameHostComponent, host => {
            host.yPosition.set(first);
            host.secondYPosition.set(second);
        });
        expect(yAxisSides(fixture.componentInstance.chart())).toEqual(expected);
    });

    it("puts the Y axis of a heatmap and a waterfall on the start side", () => {
        expect(yAxisSides(renderIn("rtl", HeatmapHostComponent).componentInstance.chart())).toEqual(["right"]);
        TestBed.resetTestingModule();
        expect(yAxisSides(renderIn("rtl", WaterfallHostComponent).componentInstance.chart())).toEqual(["right"]);
    });

    it("keeps the X axis left to right", () => {
        const fixture = renderIn("rtl", FrameHostComponent);
        const scene = fixture.componentInstance.chart().scene() as ChartScene;
        const [first, second] = scene.hitTargets.filter(hit => hit.seriesName === "Revenue");
        expect(first.category ?? first.xValue).toBe("A");
        expect(second.category ?? second.xValue).toBe("B");
        expect(first.bounds?.x).toBeLessThan(second.bounds?.x as number);
    });

    it("lays out again when the direction changes", async () => {
        const fixture = renderIn("ltr", FrameHostComponent);
        const chart = fixture.componentInstance.chart();
        expect(yAxisSides(chart)).toEqual(["left"]);

        document.documentElement.setAttribute("dir", "rtl");
        await vi.waitFor(() => {
            fixture.detectChanges();
            TestBed.tick();
            expect(yAxisSides(chart)).toEqual(["right"]);
        });
    });

    it("gives each chart its own direction in mixed subtrees", () => {
        const fixture = render(MixedHostComponent);
        expect(yAxisSides(fixture.componentInstance.rtl())).toEqual(["right"]);
        expect(yAxisSides(fixture.componentInstance.ltr())).toEqual(["left"]);
    });

    it.each<[ChartHeaderAlignment, "ltr" | "rtl", string]>([
        ["start", "ltr", "items-start"],
        ["start", "rtl", "items-start"],
        ["end", "rtl", "items-end"],
        ["center", "rtl", "items-center"],
        ["left", "ltr", "items-start"],
        ["left", "rtl", "items-end"],
        ["right", "ltr", "items-end"],
        ["right", "rtl", "items-start"]
    ])("aligns the title %s in %s with %s", (titleAlign, dir, expected) => {
        const fixture = renderIn(dir, FrameHostComponent, host => host.titleAlign.set(titleAlign));
        const header = chartHost(fixture).querySelector('[data-mona-chart-export-role="title"]')
            ?.parentElement as HTMLElement;
        expect(header.className).toContain(expected);
        expect(header.style.textAlign).toBe("");
    });

    it("defaults the title to the start", () => {
        const fixture = renderIn("rtl", FrameHostComponent);
        expect(fixture.componentInstance.chart().titleAlign()).toBe("start");
    });

    // In a row that follows the direction, the first item is on the right in RTL.
    it.each<[ChartLegendPosition, "ltr" | "rtl", number, string]>([
        ["start", "ltr", 0, "me-4"],
        ["start", "rtl", 0, "me-4"],
        ["end", "rtl", 1, "ms-4"],
        ["left", "ltr", 0, "me-4"],
        ["left", "rtl", 1, "ms-4"],
        ["right", "ltr", 1, "ms-4"],
        ["right", "rtl", 0, "me-4"]
    ])("orders a %s legend in %s", (position, dir, legendOrder, margin) => {
        const fixture = renderIn(dir, FrameHostComponent, host => host.legendPosition.set(position));
        const legend = chartHost(fixture).querySelector("mona-chart-legend") as HTMLElement;
        expect(legend.style.order).toBe(String(legendOrder));
        const plot = legend.parentElement?.firstElementChild as HTMLElement;
        expect(plot.style.order).toBe(String(1 - legendOrder));
        expect(legend.parentElement?.className).toContain("flex-row");
        expect((legend.firstElementChild as HTMLElement).className).toContain(margin);
    });

    it("prefers the side reading runs towards for an automatic label beside a point", () => {
        const hit = { point: { x: 100, y: 100 }, seriesType: "candlestick" } as unknown as SceneHitTarget;
        const options = { offset: 4, position: "auto" } as unknown as NormalizedChartDataLabelOptions;
        const plot = { height: 400, width: 600, x: 0, y: 0 };

        setChartLocale("en-US", CHART_DEFAULT_MESSAGES, "ltr");
        expect(ChartDataLabelPlacement.resolvePlacements(hit, options, 20, 10, plot)[0].placement).toBe("right");
        setChartLocale("en-US", CHART_DEFAULT_MESSAGES, "rtl");
        expect(ChartDataLabelPlacement.resolvePlacements(hit, options, 20, 10, plot)[0].placement).toBe("left");
    });

    it("passes axe in RTL with a start legend and two axes", async () => {
        const fixture = renderIn("rtl", FrameHostComponent, host => {
            host.legendPosition.set("start");
            host.yPosition.set("start");
        });
        const results = await axe.run(chartHost(fixture), { rules: { "color-contrast": { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});

describe("Chart visual accessibility", () => {
    it("draws a solid focus outline on the host and legend items, which forced colors keeps", () => {
        const fixture = render(FrameHostComponent);
        const host = chartHost(fixture);
        const legendButton = host.querySelector("mona-chart-legend button") as HTMLElement;

        for (const element of [host, legendButton]) {
            expect(element.className).toContain("focus-visible:outline-2");
            expect(element.className).toContain("focus-visible:outline-focus-indicator");
            expect(element.className).not.toMatch(/\bring-|:ring-|outline-none/);
        }
    });

    it("has a fallback palette at 3:1 on white and near-black", () => {
        const fixture = render(FrameHostComponent);
        const scene = fixture.componentInstance.chart().scene() as unknown as {
            series: readonly { style: { color: string } }[];
        };
        const colors = new Set(scene.series.map(series => series.style.color));
        expect(colors.size).toBe(5);
        for (const color of colors) {
            expect(wcagContrast(color, "#ffffff"), color).toBeGreaterThanOrEqual(3);
            expect(wcagContrast(color, "#09090b"), color).toBeGreaterThanOrEqual(3);
        }
    });

    it("tells rising candles from falling ones by more than color, in colors at 3:1", () => {
        const fixture = render(CandlestickHostComponent);
        const scene = fixture.componentInstance.chart().scene() as unknown as {
            series: readonly {
                fillMode: string;
                style: { fallingColor: string; risingColor: string };
                type: string;
            }[];
        };
        const series = scene.series.find(entry => entry.type === "candlestick");
        expect(series?.fillMode).toBe("hollow");
        expect(wcagContrast(series?.style.risingColor as string, "#ffffff")).toBeGreaterThanOrEqual(3);
        expect(wcagContrast(series?.style.fallingColor as string, "#ffffff")).toBeGreaterThanOrEqual(3);
    });

    it("draws waterfall increases at 3:1 by default", () => {
        const fixture = render(WaterfallHostComponent);
        const scene = fixture.componentInstance.chart().scene() as unknown as {
            series: readonly { style: { increaseColor: string } }[];
        };
        expect(wcagContrast(scene.series[0].style.increaseColor, "#ffffff")).toBeGreaterThanOrEqual(3);
    });

    it("keeps a hidden legend item's name at text contrast and dims only its bullet", () => {
        const fixture = render(FrameHostComponent);
        const legendButton = chartHost(fixture).querySelector("mona-chart-legend button") as HTMLElement;
        legendButton.click();
        fixture.detectChanges();
        TestBed.tick();
        fixture.detectChanges();

        const hidden = chartHost(fixture).querySelector(
            'mona-chart-legend button[aria-pressed="false"]'
        ) as HTMLElement;
        expect(hidden.className).toContain("text-muted-foreground");
        expect(hidden.className).toContain("line-through");
        expect(hidden.className.split(/\s+/)).not.toContain("opacity-40");
        expect(hidden.className).toContain("[&>[data-mona-chart-export-role=legend-bullet]]:opacity-40");
    });
});
