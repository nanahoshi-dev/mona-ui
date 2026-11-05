import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BubbleSeriesComponent } from "../components/bubble-series/bubble-series.component";
import { CandlestickSeriesComponent } from "../components/candlestick-series/candlestick-series.component";
import { ChartAnnotationComponent } from "../components/chart-annotation/chart-annotation.component";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartLegendComponent } from "../components/chart-legend/chart-legend.component";
import { ChartReferenceLineComponent } from "../components/chart-reference-line/chart-reference-line.component";
import { ChartSelectionComponent } from "../components/chart-selection/chart-selection.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { DonutSeriesComponent } from "../components/donut-series/donut-series.component";
import { FunnelSeriesComponent } from "../components/funnel-series/funnel-series.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { OhlcSeriesComponent } from "../components/ohlc-series/ohlc-series.component";
import { PieSeriesComponent } from "../components/pie-series/pie-series.component";
import { PolarSeriesComponent } from "../components/polar-series/polar-series.component";
import { RadialBarSeriesComponent } from "../components/radial-bar-series/radial-bar-series.component";
import { RoseSeriesComponent } from "../components/rose-series/rose-series.component";
import { ScatterSeriesComponent } from "../components/scatter-series/scatter-series.component";
import { TreemapSeriesComponent } from "../components/treemap-series/treemap-series.component";
import { ChartAnnotationLabelTemplateDirective } from "../directives/chart-annotation-label-template.directive";
import { ChartAxisLabelTemplateDirective } from "../directives/chart-axis-label-template.directive";
import { ChartCenterTemplateDirective } from "../directives/chart-center-template.directive";
import { ChartCrosshairLabelTemplateDirective } from "../directives/chart-crosshair-label-template.directive";
import { ChartDataLabelTemplateDirective } from "../directives/chart-data-label-template.directive";
import { ChartFunnelLabelTemplateDirective } from "../directives/chart-funnel-label-template.directive";
import { ChartGaugeCenterTemplateDirective } from "../directives/chart-gauge-center-template.directive";
import { ChartLegendItemTemplateDirective } from "../directives/chart-legend-item-template.directive";
import { ChartNoDataTemplateDirective } from "../directives/chart-no-data-template.directive";
import { ChartReferenceLabelTemplateDirective } from "../directives/chart-reference-label-template.directive";
import { ChartSliceLabelTemplateDirective } from "../directives/chart-slice-label-template.directive";
import { ChartSubtitleTemplateDirective } from "../directives/chart-subtitle-template.directive";
import { ChartTitleTemplateDirective } from "../directives/chart-title-template.directive";
import { ChartTooltipTemplateDirective } from "../directives/chart-tooltip-template.directive";
import { ChartTreemapLabelTemplateDirective } from "../directives/chart-treemap-label-template.directive";
import { ChartWaterfallLabelTemplateDirective } from "../directives/chart-waterfall-label-template.directive";
import type { ChartScene } from "../internal/scene/chart-scene";
import type { ChartLegendItem } from "../models/chart-series.models";
import type { ChartSelectionChangeEvent } from "../models/chart-selection.models";
import type { ChartTreemapNodeVisibilityEvent } from "../models/chart-treemap.models";
import type { ChartViewportChangeEvent, ChartViewportState } from "../models/chart-viewport.models";

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

function settle(fixture: ComponentFixture<{ chart: () => ChartComponent }>): void {
    fixture.detectChanges();
    TestBed.tick();
    fixture.componentInstance.chart().flushPendingRender();
    fixture.detectChanges();
}

afterEach(() => {
    vi.restoreAllMocks();
});

@Component({
    imports: [ChartComponent, ChartXAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart
            [animation]="false"
            [style.width.px]="600"
            [style.height.px]="400"
            [data]="data"
            xField="x"
            [navigation]="true"
            [(viewport)]="viewport"
            (viewportChangeDetails)="details.push($event)">
            <mona-chart-x-axis axisId="main" type="linear" />
            <mona-line-series field="y" />
        </mona-chart>
    `
})
class TwoWayViewportHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { x: 0, y: 1 },
        { x: 50, y: 2 },
        { x: 100, y: 3 }
    ];
    public readonly details: ChartViewportChangeEvent[] = [];
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
}

@Component({
    imports: [ChartComponent, ChartXAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart
            [animation]="false"
            [style.width.px]="600"
            [style.height.px]="400"
            [data]="data"
            xField="x"
            [navigation]="true"
            [viewport]="viewport()"
            (viewportChange)="proposals.push($event)">
            <mona-chart-x-axis axisId="main" type="linear" />
            <mona-line-series field="y" />
        </mona-chart>
    `
})
class DecliningViewportHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { x: 0, y: 1 },
        { x: 100, y: 3 }
    ];
    public readonly proposals: ChartViewportState[] = [];
    public readonly viewport = signal<ChartViewportState | undefined>({
        axes: [{ axis: "x", axisId: "main", kind: "continuous", max: 80, min: 20 }]
    });
}

function xWindow(chart: ChartComponent): { max: number; min: number } {
    const axis = chart.getViewport()?.axes.find(entry => entry.axis === "x");
    return axis as unknown as { max: number; min: number };
}

describe("Chart two-way viewport", () => {
    it("writes changes to [(viewport)] and reports the details separately", () => {
        const fixture = render(TwoWayViewportHostComponent);
        const host = fixture.componentInstance;
        settle(fixture);

        host.chart().setViewportWindow({ axis: "x", axisId: "main", kind: "continuous", max: 75, min: 25 });
        settle(fixture);

        const window = host.viewport()?.axes.find(entry => entry.axis === "x") as unknown as {
            max: number;
            min: number;
        };
        expect(window.min).toBe(25);
        expect(window.max).toBe(75);
        expect(xWindow(host.chart()).min).toBe(25);

        const last = host.details.at(-1) as ChartViewportChangeEvent;
        expect(last.source).toBe("programmatic");
        expect(last.viewport).toEqual(host.viewport());
        expect(last.previousViewport).toBeDefined();
    });

    it("applies a value the parent writes", () => {
        const fixture = render(TwoWayViewportHostComponent);
        const host = fixture.componentInstance;
        settle(fixture);

        host.viewport.set({ axes: [{ axis: "x", axisId: "main", kind: "continuous", max: 60, min: 40 }] });
        settle(fixture);

        expect(xWindow(host.chart())).toMatchObject({ max: 60, min: 40 });
    });

    it("stays where it is when a controlled parent declines a change", () => {
        const fixture = render(DecliningViewportHostComponent);
        const host = fixture.componentInstance;
        settle(fixture);

        host.chart().setViewportWindow({ axis: "x", axisId: "main", kind: "continuous", max: 75, min: 25 });
        settle(fixture);

        expect((host.proposals.at(-1)?.axes[0] as unknown as { min: number }).min).toBe(25);
        expect(xWindow(host.chart())).toMatchObject({ max: 80, min: 20 });
    });
});

@Component({
    imports: [ChartComponent, ChartSelectionComponent, LineSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-line-series field="y" name="Revenue" [showPoints]="true" />
            <mona-chart-selection [(selectedMarkIds)]="selected" (selectionChange)="events.push($event)" />
        </mona-chart>
    `
})
class TwoWaySelectionHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { x: "A", y: 1 },
        { x: "B", y: 2 }
    ];
    public readonly events: ChartSelectionChangeEvent[] = [];
    public readonly selected = signal<readonly string[] | undefined>([]);
}

describe("Chart two-way selection", () => {
    it("writes the selection to [(selectedMarkIds)]", () => {
        const fixture = render(TwoWaySelectionHostComponent);
        const host = fixture.componentInstance;
        settle(fixture);
        const element = (fixture.nativeElement as HTMLElement).querySelector("mona-chart") as HTMLElement;

        element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        settle(fixture);
        element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
        settle(fixture);

        expect(host.events).toHaveLength(1);
        expect(host.selected()).toEqual(host.events[0].selectedMarkIds);
        expect(host.selected()?.length).toBe(1);
    });
});

const DATUM_ROWS = [
    { c: "A", v: 1 },
    { c: "B", v: 2 },
    { c: "C", v: 3 }
];

@Component({
    imports: [
        ChartComponent,
        ChartLegendComponent,
        DonutSeriesComponent,
        FunnelSeriesComponent,
        PieSeriesComponent,
        RadialBarSeriesComponent,
        RoseSeriesComponent,
        TreemapSeriesComponent
    ],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data()">
            @switch (kind()) {
                @case ("pie") {
                    <mona-pie-series field="v" categoryField="c" [(hiddenIndices)]="hiddenIndices" />
                }
                @case ("donut") {
                    <mona-donut-series field="v" categoryField="c" [(hiddenIndices)]="hiddenIndices" />
                }
                @case ("funnel") {
                    <mona-funnel-series field="v" categoryField="c" [(hiddenStageIds)]="hiddenIds" />
                }
                @case ("rose") {
                    <mona-rose-series field="v" categoryField="c" [(hiddenItemIds)]="hiddenIds" />
                }
                @case ("radialBar") {
                    <mona-radial-bar-series field="v" categoryField="c" [(hiddenItemIds)]="hiddenIds" />
                }
                @case ("treemap") {
                    <mona-treemap-series field="v" labelField="c" [(hiddenNodeIds)]="hiddenIds" />
                }
            }
            <mona-chart-legend />
        </mona-chart>
    `
})
class HiddenItemsHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal<readonly { c: string; v: number }[]>(DATUM_ROWS);
    public readonly hiddenIds = signal<readonly string[]>([]);
    public readonly hiddenIndices = signal<readonly number[]>([]);
    public readonly kind = signal<string>("pie");
}

function datumItems(chart: ChartComponent): readonly ChartLegendItem[] {
    return chart.legendItems().filter(item => item.kind === "datum");
}

const BOUND: readonly [string, (host: HiddenItemsHostComponent) => readonly (number | string)[]][] = [
    ["pie", host => host.hiddenIndices()],
    ["donut", host => host.hiddenIndices()],
    ["funnel", host => host.hiddenIds()],
    ["rose", host => host.hiddenIds()],
    ["radialBar", host => host.hiddenIds()],
    ["treemap", host => host.hiddenIds()]
];

describe("Series hidden item bindings", () => {
    it.each(BOUND)("writes a legend toggle on a %s to the binding", (kind, bound) => {
        const fixture = render(HiddenItemsHostComponent, host => host.kind.set(kind));
        const host = fixture.componentInstance;
        settle(fixture);
        const items = datumItems(host.chart());
        expect(items.map(item => item.visible)).toEqual([true, true, true]);

        host.chart().toggleLegendItem(items[1]);
        settle(fixture);

        expect(bound(host)).toHaveLength(1);
        expect(datumItems(host.chart()).map(item => item.visible)).toEqual([true, false, true]);

        host.chart().toggleLegendItem(datumItems(host.chart())[1]);
        settle(fixture);

        expect(bound(host)).toEqual([]);
        expect(datumItems(host.chart()).map(item => item.visible)).toEqual([true, true, true]);
    });

    it.each(BOUND)("hides what the parent writes to the binding on a %s", (kind, bound) => {
        const fixture = render(HiddenItemsHostComponent, host => host.kind.set(kind));
        const host = fixture.componentInstance;
        settle(fixture);
        const [first] = datumItems(host.chart());

        if (kind === "pie" || kind === "donut") {
            host.hiddenIndices.set([first.dataIndex as number]);
        } else {
            host.hiddenIds.set([first.itemId]);
        }
        settle(fixture);

        expect(bound(host)).toHaveLength(1);
        expect(datumItems(host.chart()).map(item => item.visible)).toEqual([false, true, true]);
    });

    it("keeps a value bound before the data arrives", () => {
        const fixture = render(HiddenItemsHostComponent, host => {
            host.data.set([]);
            host.kind.set("pie");
            host.hiddenIndices.set([1]);
        });
        const host = fixture.componentInstance;
        settle(fixture);
        expect(host.hiddenIndices()).toEqual([1]);

        host.data.set(DATUM_ROWS);
        settle(fixture);

        expect(host.hiddenIndices()).toEqual([1]);
        expect(datumItems(host.chart()).map(item => item.visible)).toEqual([true, false, true]);
    });

    it("forgets items the new data no longer has, and tells the parent", () => {
        const fixture = render(HiddenItemsHostComponent, host => host.kind.set("rose"));
        const host = fixture.componentInstance;
        settle(fixture);
        const last = datumItems(host.chart())[2];
        host.hiddenIds.set([last.itemId]);
        settle(fixture);

        host.data.set(DATUM_ROWS.slice(0, 2));
        settle(fixture);

        expect(host.hiddenIds()).toEqual([]);
    });
});

@Component({
    imports: [BubbleSeriesComponent, ChartComponent, ChartYAxisComponent, LineSeriesComponent, ScatterSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-chart-y-axis [formatter]="axisFormatter" />
            @switch (kind()) {
                @case ("line") {
                    <mona-line-series field="y" [valueFormatter]="seriesFormatter()" />
                }
                @case ("scatter") {
                    <mona-scatter-series field="y" [valueFormatter]="seriesFormatter()" />
                }
                @case ("bubble") {
                    <mona-bubble-series field="y" sizeField="s" [valueFormatter]="seriesFormatter()" />
                }
            }
        </mona-chart>
    `
})
class ValueFormatterHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { s: 1, x: 1, y: 10 },
        { s: 2, x: 2, y: 20 }
    ];
    public readonly kind = signal("line");
    public readonly seriesFormatter = signal<((value: unknown) => string) | undefined>(
        (value: unknown) => `series ${String(value)}`
    );

    public readonly axisFormatter = (value: unknown): string => `axis ${String(value)}`;
}

function yTicks(chart: ChartComponent): readonly string[] {
    const scene = chart.scene() as unknown as {
        axes: readonly { axis: string; ticks: readonly { formattedValue: string }[] }[];
    };
    return (scene.axes.find(axis => axis.axis === "y")?.ticks ?? []).map(tick => tick.formattedValue);
}

describe("Series value formatter", () => {
    it.each(["line", "scatter", "bubble"])("formats %s values without changing the axis ticks", kind => {
        const fixture = render(ValueFormatterHostComponent, host => host.kind.set(kind));
        const chart = fixture.componentInstance.chart();
        settle(fixture);

        const hits = (chart.scene() as ChartScene).hitTargets;
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].formattedValue).toBe("series 10");
        expect(yTicks(chart).every(tick => tick.startsWith("axis "))).toBe(true);
    });

    it.each(["line", "scatter", "bubble"])("falls back to the axis formatter on a %s", kind => {
        const fixture = render(ValueFormatterHostComponent, host => {
            host.kind.set(kind);
            host.seriesFormatter.set(undefined);
        });
        const chart = fixture.componentInstance.chart();
        settle(fixture);

        expect((chart.scene() as ChartScene).hitTargets[0].formattedValue).toBe("axis 10");
    });
});

@Component({
    imports: [CandlestickSeriesComponent, ChartComponent, OhlcSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            @if (kind() === "candlestick") {
                <mona-candlestick-series
                    openField="o"
                    highField="h"
                    lowField="l"
                    closeField="c"
                    [fillOpacity]="fillOpacity()"
                    [opacity]="opacity()" />
            } @else {
                <mona-ohlc-series
                    openField="o"
                    highField="h"
                    lowField="l"
                    closeField="c"
                    [fillOpacity]="fillOpacity()"
                    [opacity]="opacity()" />
            }
        </mona-chart>
    `
})
class FinancialAliasHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [{ c: 12, h: 13, l: 9, o: 10, x: "A" }];
    public readonly fillOpacity = signal<number | undefined>(undefined);
    public readonly kind = signal("candlestick");
    public readonly opacity = signal<number | undefined>(undefined);
}

@Component({
    imports: [ChartComponent, ChartLegendComponent, TreemapSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data">
            <mona-treemap-series
                field="v"
                labelField="c"
                [categoryFormatter]="categoryFormatter"
                [labelFormatter]="labelFormatter"
                (nodeVisibilityChange)="visibility.push($event)" />
            <mona-chart-legend />
        </mona-chart>
    `
})
class TreemapAliasHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = DATUM_ROWS;
    public readonly visibility: ChartTreemapNodeVisibilityEvent[] = [];

    public readonly categoryFormatter = (value: unknown): string => `category ${String(value)}`;
    public readonly labelFormatter = (value: unknown): string => `label ${String(value)}`;
}

@Component({
    imports: [ChartComponent, PolarSeriesComponent],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data">
            <mona-polar-series field="r" angleField="wrong" categoryField="a" name="Wind" />
        </mona-chart>
    `
})
class PolarAliasHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { a: 0, r: 1, wrong: 180 },
        { a: 90, r: 2, wrong: 270 }
    ];
}

describe("Series input aliases", () => {
    it.each(["candlestick", "ohlc"])("reads fillOpacity on %s, then the deprecated opacity", kind => {
        const fixture = render(FinancialAliasHostComponent, host => {
            host.kind.set(kind);
            host.opacity.set(0.4);
        });
        const chart = fixture.componentInstance.chart();
        settle(fixture);
        const opacity = (): number =>
            (chart.scene() as unknown as { series: readonly { style: { opacity: number } }[] }).series[0].style.opacity;
        expect(opacity()).toBe(0.4);

        fixture.componentInstance.fillOpacity.set(0.7);
        settle(fixture);
        expect(opacity()).toBe(0.7);
    });

    it("prefers categoryFormatter on a treemap", () => {
        const fixture = render(TreemapAliasHostComponent);
        settle(fixture);
        const names = fixture.componentInstance
            .chart()
            .legendItems()
            .map(item => item.name);
        const labels = (fixture.componentInstance.chart().scene() as ChartScene).hitTargets.map(
            hit => hit.hierarchy?.formattedLabel
        );
        expect([...names, ...labels].some(text => text?.startsWith("category "))).toBe(true);
        expect([...names, ...labels].some(text => text?.startsWith("label "))).toBe(false);

        const chart = fixture.componentInstance.chart();
        chart.toggleLegendItem(datumItems(chart)[0]);
        expect(fixture.componentInstance.visibility[0].formattedLabel).toMatch(/^category /);
    });

    it("prefers categoryField on a polar series", () => {
        const fixture = render(PolarAliasHostComponent);
        settle(fixture);
        const hits = (fixture.componentInstance.chart().scene() as ChartScene).hitTargets;
        expect(hits.map(hit => hit.xValue ?? hit.category)).toEqual(["0°", "90°"]);
    });
});

@Component({
    imports: [
        ChartAnnotationComponent,
        ChartAnnotationLabelTemplateDirective,
        ChartComponent,
        ChartReferenceLabelTemplateDirective,
        ChartReferenceLineComponent,
        LineSeriesComponent
    ],
    template: `
        <mona-chart [animation]="false" [style.width.px]="600" [style.height.px]="400" [data]="data" xField="x">
            <mona-line-series field="y" />
            <mona-chart-reference-line axis="y" [value]="15" label="Target">
                <ng-template monaChartReferenceLabelTemplate let-formattedValue="formattedValue">
                    <span class="suffixed-reference">{{ formattedValue }}</span>
                </ng-template>
            </mona-chart-reference-line>
            <mona-chart-annotation [x]="'A'" [y]="10" label="Note">
                <ng-template monaChartAnnotationLabelTemplate let-formattedY="formattedY">
                    <span class="suffixed-annotation">{{ formattedY }}</span>
                </ng-template>
            </mona-chart-annotation>
        </mona-chart>
    `
})
class SuffixedSelectorHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = [
        { x: "A", y: 10 },
        { x: "B", y: 20 }
    ];
}

describe("Chart template directives", () => {
    it("all have a context guard, so let- variables are typed under strictTemplates", () => {
        const directives = [
            ChartAnnotationLabelTemplateDirective,
            ChartAxisLabelTemplateDirective,
            ChartCenterTemplateDirective,
            ChartCrosshairLabelTemplateDirective,
            ChartDataLabelTemplateDirective,
            ChartFunnelLabelTemplateDirective,
            ChartGaugeCenterTemplateDirective,
            ChartLegendItemTemplateDirective,
            ChartNoDataTemplateDirective,
            ChartReferenceLabelTemplateDirective,
            ChartSliceLabelTemplateDirective,
            ChartSubtitleTemplateDirective,
            ChartTitleTemplateDirective,
            ChartTooltipTemplateDirective,
            ChartTreemapLabelTemplateDirective,
            ChartWaterfallLabelTemplateDirective
        ];
        for (const directive of directives) {
            expect(typeof directive.ngTemplateContextGuard, directive.name).toBe("function");
        }
    });

    it("accept the Template-suffixed selectors", () => {
        const fixture = render(SuffixedSelectorHostComponent);
        settle(fixture);
        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector(".suffixed-reference")).not.toBeNull();
        expect(element.querySelector(".suffixed-annotation")).not.toBeNull();
    });
});

describe("Chart component surface", () => {
    it("exposes its state as read-only signals", () => {
        const fixture = render(TwoWayViewportHostComponent);
        const chart = fixture.componentInstance.chart();
        for (const state of [chart.scene, chart.tooltipContext, chart.tooltipPosition]) {
            expect("set" in state).toBe(false);
        }
    });

    it("provides itself as the context its children register with", () => {
        const fixture = render(TwoWayViewportHostComponent);
        settle(fixture);
        expect((fixture.componentInstance.chart().scene() as ChartScene).hitTargets.length).toBeGreaterThan(0);
    });
});
