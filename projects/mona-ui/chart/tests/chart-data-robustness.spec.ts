import { Component, ErrorHandler, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import { FunnelSeriesComponent } from "../components/funnel-series/funnel-series.component";
import { PieSeriesComponent } from "../components/pie-series/pie-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import type { CartesianXYChartScene } from "../internal/scene/chart-scene";
import type { ChartBarSeriesScene, ChartLineSeriesScene } from "../internal/scene/cartesian-scene";
import type { ChartAxisFormatter, ChartXAxisType } from "../models/chart-axis.models";
import type { ChartField } from "../models/chart.models";

@Component({
    imports: [ChartComponent, LineSeriesComponent],
    template: `
        <mona-chart [style.width.px]="600" [style.height.px]="400" [data]="data()" xField="x">
            <mona-line-series name="Revenue" field="y" />
        </mona-chart>
    `
})
class LineHostComponent {
    public readonly data = signal<readonly unknown[]>([]);
}

@Component({
    imports: [ChartComponent, BarSeriesComponent, ChartXAxisComponent],
    template: `
        <mona-chart [style.width.px]="600" [style.height.px]="400" [data]="data()" xField="x">
            <mona-chart-x-axis [type]="xType()" />
            <mona-bar-series name="Units" field="y" />
        </mona-chart>
    `
})
class BarHostComponent {
    public readonly data = signal<readonly unknown[]>([]);
    public readonly xType = signal<ChartXAxisType>("auto");
}

@Component({
    imports: [ChartComponent, LineSeriesComponent, ChartYAxisComponent],
    template: `
        <mona-chart [style.width.px]="600" [style.height.px]="400" [data]="data()" xField="x">
            <mona-chart-y-axis [formatter]="yFormatter()" />
            <mona-line-series name="Good" field="y" />
            <mona-line-series name="Broken" [field]="brokenField()" />
        </mona-chart>
    `
})
class FailingCallbackHostComponent {
    public readonly brokenField = signal<ChartField>("y");
    public readonly data = signal<readonly unknown[]>([]);
    public readonly yFormatter = signal<ChartAxisFormatter | undefined>(undefined);
}

@Component({
    imports: [ChartComponent, PieSeriesComponent],
    template: `
        <mona-chart [style.width.px]="400" [style.height.px]="400">
            <mona-pie-series name="Share" [data]="data()" field="value" categoryField="name" />
        </mona-chart>
    `
})
class PieHostComponent {
    public readonly data = signal<readonly unknown[]>([]);
}

@Component({
    imports: [ChartComponent, FunnelSeriesComponent],
    template: `
        <mona-chart [style.width.px]="400" [style.height.px]="400">
            <mona-funnel-series name="Pipeline" [data]="data()" field="value" categoryField="name" />
        </mona-chart>
    `
})
class FunnelHostComponent {
    public readonly data = signal<readonly unknown[]>([]);
}

function render<T>(component: new () => T, data: readonly unknown[], errorHandler?: ErrorHandler): ComponentFixture<T> {
    TestBed.configureTestingModule({
        imports: [component],
        providers: errorHandler ? [{ provide: ErrorHandler, useValue: errorHandler }] : []
    });
    const fixture = TestBed.createComponent(component);
    (fixture.componentInstance as { data: { set(value: readonly unknown[]): void } }).data.set(data);
    fixture.detectChanges();
    return fixture;
}

function sceneOf(fixture: ComponentFixture<unknown>): CartesianXYChartScene {
    const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
    return chart.scene() as CartesianXYChartScene;
}

function linePoints(fixture: ComponentFixture<unknown>): number {
    const series = sceneOf(fixture).series[0] as ChartLineSeriesScene | undefined;
    return series?.points.filter(point => point.defined).length ?? 0;
}

function bars(fixture: ComponentFixture<unknown>): number {
    const series = sceneOf(fixture).series[0] as ChartBarSeriesScene | undefined;
    return series?.bars.length ?? 0;
}

describe("Chart data robustness", () => {
    let warn: MockInstance<typeof console.warn>;

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function warnings(): string[] {
        return warn.mock.calls.map(call => String(call[0]));
    }

    describe("a value the chart can't place", () => {
        for (const [label, bad] of [
            ["NaN", Number.NaN],
            ["Infinity", Number.POSITIVE_INFINITY],
            ["text", "abc"],
            ["blank text", ""]
        ] as const) {
            it(`drops only that point for ${label}, and names the series`, () => {
                const fixture = render(LineHostComponent, [
                    { x: "A", y: 1 },
                    { x: "B", y: bad },
                    { x: "C", y: 3 }
                ]);
                const scene = sceneOf(fixture);

                expect(scene.hasRenderableData).toBe(true);
                expect(scene.yAxisType).toBe("linear");
                expect(linePoints(fixture)).toBe(2);
                expect(warnings().some(message => message.includes('"Revenue"') && message.includes("left out"))).toBe(
                    true
                );
            });
        }

        it("treats null and undefined as gaps without a warning", () => {
            const fixture = render(LineHostComponent, [
                { x: "A", y: 1 },
                { x: "B", y: null },
                { x: "C", y: undefined },
                { x: "D", y: 4 }
            ]);

            expect(linePoints(fixture)).toBe(2);
            expect(warnings().filter(message => message.includes("left out"))).toEqual([]);
        });
    });

    it("reads numeric strings as numbers", () => {
        const fixture = render(LineHostComponent, [
            { x: "A", y: "10" },
            { x: "B", y: " 20.5 " },
            { x: "C", y: "5" }
        ]);
        const scene = sceneOf(fixture);

        expect(scene.yAxisType).toBe("linear");
        expect(linePoints(fixture)).toBe(3);
        expect(warnings().filter(message => message.includes("left out"))).toEqual([]);
    });

    it("keeps a numeric X axis linear when one X is Infinity, leaving that point out", () => {
        const fixture = render(LineHostComponent, [
            { x: 1, y: 1 },
            { x: Number.POSITIVE_INFINITY, y: 2 },
            { x: 3, y: 3 }
        ]);
        const scene = sceneOf(fixture);

        expect(scene.xAxisType).toBe("linear");
        expect(linePoints(fixture)).toBe(2);
        const points = (scene.series[0] as ChartLineSeriesScene).points.filter(point => point.defined);
        expect(points.every(point => Number.isFinite(point.x) && Number.isFinite(Number(point.xValue)))).toBe(true);
    });

    describe("bars on numbers", () => {
        it("give an auto X axis categories, so years and ids draw", () => {
            const fixture = render(BarHostComponent, [
                { x: 2021, y: 5 },
                { x: 2022, y: 7 },
                { x: 2023, y: 6 }
            ]);
            const scene = sceneOf(fixture);

            expect(scene.xAxisType).toBe("category");
            expect(bars(fixture)).toBe(3);
        });

        it("warn on an explicit linear X axis, naming the series", () => {
            const fixture = render(BarHostComponent, [{ x: 2021, y: 5 }]);
            fixture.componentInstance.xType.set("linear");
            fixture.detectChanges();

            expect(bars(fixture)).toBe(0);
            expect(
                warnings().some(
                    message => message.includes('bar series "Units"') && message.includes("category X axis")
                )
            ).toBe(true);
        });
    });
    describe("a callback that throws", () => {
        function reporter(): { errors: unknown[]; handler: ErrorHandler } {
            const errors: unknown[] = [];
            return { errors, handler: { handleError: (error: unknown) => errors.push(error) } as ErrorHandler };
        }

        function series(fixture: ComponentFixture<unknown>, name: string): ChartLineSeriesScene | undefined {
            return sceneOf(fixture).series.find(entry => entry.name === name) as ChartLineSeriesScene | undefined;
        }

        it("drops only its own series, keeps the others updating, and is reported once", () => {
            const { errors, handler } = reporter();
            const fixture = render(
                FailingCallbackHostComponent,
                [
                    { x: "A", y: 1 },
                    { x: "B", y: 2 }
                ],
                handler
            );
            fixture.componentInstance.brokenField.set(() => {
                throw new Error("bad accessor");
            });
            expect(() => fixture.detectChanges()).not.toThrow();

            fixture.componentInstance.data.set([
                { x: "A", y: 1 },
                { x: "B", y: 2 },
                { x: "C", y: 3 }
            ]);
            expect(() => fixture.detectChanges()).not.toThrow();

            expect(series(fixture, "Good")?.points.filter(point => point.defined)).toHaveLength(3);
            expect(series(fixture, "Broken")?.points.filter(point => point.defined) ?? []).toHaveLength(0);
            expect(errors).toHaveLength(1);
            expect(String(errors[0])).toContain('line series "Broken" field threw: bad accessor');
        });

        it("shows the value as text in place of a formatter that throws", () => {
            const { errors, handler } = reporter();
            const fixture = render(
                FailingCallbackHostComponent,
                [
                    { x: "A", y: 1 },
                    { x: "B", y: 2 }
                ],
                handler
            );
            fixture.componentInstance.yFormatter.set(() => {
                throw new Error("bad formatter");
            });
            expect(() => fixture.detectChanges()).not.toThrow();

            const yAxis = sceneOf(fixture).axes.find(axis => axis.axis === "y");
            expect(yAxis?.ticks.length).toBeGreaterThan(0);
            expect(yAxis?.ticks.every(tick => tick.formattedValue === String(tick.value))).toBe(true);
            expect(errors).toHaveLength(1);
            expect(String(errors[0])).toContain("formatter threw: bad formatter");
        });
    });
    describe("pie and funnel values", () => {
        it("read numeric strings as numbers", () => {
            const pie = render(PieHostComponent, [
                { name: "A", value: "10" },
                { name: "B", value: "30" }
            ]);
            const chart = pie.debugElement.children[0].componentInstance as ChartComponent;
            expect(chart.scene()?.hasRenderableData).toBe(true);
            expect(warnings()).toEqual([]);
        });

        it("name the series when values are negative or aren't numbers", () => {
            render(PieHostComponent, [
                { name: "A", value: 10 },
                { name: "B", value: -5 },
                { name: "C", value: "n/a" }
            ]);
            expect(warnings()).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('pie series "Share" has negative values'),
                    expect.stringContaining(`pie series "Share" has values that aren't finite numbers`)
                ])
            );
        });

        it("say when nothing is above zero", () => {
            render(PieHostComponent, [
                { name: "A", value: 0 },
                { name: "B", value: 0 }
            ]);
            expect(warnings()).toEqual([expect.stringContaining('pie series "Share" has no values above zero')]);

            warn.mockClear();
            TestBed.resetTestingModule();
            render(FunnelHostComponent, [
                { name: "A", value: 0 },
                { name: "B", value: "x" }
            ]);
            expect(warnings()).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('Funnel series "Pipeline" has no values above zero'),
                    expect.stringContaining(`Funnel series "Pipeline" has values that aren't finite numbers`)
                ])
            );
        });
    });
});
