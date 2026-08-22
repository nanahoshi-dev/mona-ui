import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartComponent } from "./chart.component";

interface DataItem {
    readonly x: number;
    readonly y: number;
}

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, BarSeriesComponent],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            xField="x"
            [downsampling]="downsampling()"
            [style.width.px]="500"
            [style.height.px]="300"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" [type]="xType()" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            @if (mode() === "line") {
                <mona-line-series field="y" name="L" />
            } @else {
                <mona-bar-series field="y" name="B" />
            }
        </mona-chart>
    `
})
class DensityRuntimeHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal<readonly unknown[]>([]);
    public readonly downsampling = signal<ChartDownsamplingInput>(true);
    public readonly mode = signal<"bar" | "line">("line");
    public readonly xType = signal<"linear" | "category">("linear");
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public observe(): void {}

    public unobserve(): void {}

    public disconnect(): void {}
}

describe("density runtime structural attachment (WP7)", () => {
    let fixture: ComponentFixture<DensityRuntimeHostComponent>;
    let host: DensityRuntimeHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const widthAttr = this.style?.width ? Number.parseFloat(this.style.width) : NaN;
            const heightAttr = this.style?.height ? Number.parseFloat(this.style.height) : NaN;
            const width = Number.isFinite(widthAttr) ? widthAttr : 500;
            const height = Number.isFinite(heightAttr) ? heightAttr : 300;
            return {
                bottom: height,
                height,
                left: 0,
                right: width,
                top: 0,
                width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect;
        });

        await TestBed.configureTestingModule({
            imports: [DensityRuntimeHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DensityRuntimeHostComponent);
        host = fixture.componentInstance;
    });

    afterEach(() => {
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    const render = (): void => {
        fixture.detectChanges();
        host.chart().flushPendingRender();
    };

    it("builds a retained density runtime for a large monotonic line", () => {
        const data: DataItem[] = Array.from({ length: 50_000 }, (_, i) => ({ x: i, y: Math.sin(i / 100) * 10 }));
        host.data.set(data);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const density = scene?.densityRuntime;
        expect(density).toBeDefined();
        const entry = density?.seriesById.size ?? 0;
        expect(entry).toBeGreaterThan(0);

        const seriesEntry = Array.from(density!.seriesById.values())[0];
        expect(seriesEntry.capability.eligible).toBe(true);
        expect(seriesEntry.scalar?.validCount).toBe(50_000);
        expect(seriesEntry.scalar?.monotonicity).toBe("ascending");
        // Typed arrays are compact and aligned with the source array.
        expect(seriesEntry.scalar?.x.length).toBe(50_000);
        expect(seriesEntry.scalar?.sourceData).toBe(data);
    });

    it("does not build a density runtime below threshold", () => {
        host.data.set(Array.from({ length: 100 }, (_, i) => ({ x: i, y: i })));
        render();

        expect(host.chart()["cartesianXYScene"]()?.densityRuntime).toBeUndefined();
    });

    it("does not build when disabled globally", () => {
        host.downsampling.set(false);
        host.data.set(Array.from({ length: 50_000 }, (_, i) => ({ x: i, y: i })));
        render();

        expect(host.chart()["cartesianXYScene"]()?.densityRuntime).toBeUndefined();
    });

    it("does not build for category X axes (viewport culling only policy)", () => {
        host.xType.set("category");
        host.mode.set("line");
        host.data.set(Array.from({ length: 2_500 }, (_, i) => ({ x: `c${i}`, y: i })));
        render();

        expect(host.chart()["cartesianXYScene"]()?.densityRuntime).toBeUndefined();
    }, 15_000);

    it("retires the previous runtime on data replacement", () => {
        host.data.set(Array.from({ length: 50_000 }, (_, i) => ({ x: i, y: i })));
        render();
        const firstRuntime = host.chart()["cartesianXYScene"]()?.densityRuntime;

        host.data.set(Array.from({ length: 60_000 }, (_, i) => ({ x: i, y: -i })));
        render();
        const secondRuntime = host.chart()["cartesianXYScene"]()?.densityRuntime;

        expect(firstRuntime).toBeDefined();
        expect(secondRuntime).toBeDefined();
        expect(secondRuntime).not.toBe(firstRuntime);
        expect(Array.from(secondRuntime!.seriesById.values())[0].scalar?.validCount).toBe(60_000);
    });
});
