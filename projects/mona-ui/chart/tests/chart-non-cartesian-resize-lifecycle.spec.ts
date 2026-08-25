import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { GaugeSeriesComponent } from "../components/gauge-series/gauge-series.component";
import { TreemapSeriesComponent } from "../components/treemap-series/treemap-series.component";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";

class FakeResizeObserver {
    public static instances: FakeResizeObserver[] = [];
    public readonly observed = new Set<Element>();

    public constructor(public readonly callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this);
    }

    public static reset(): void {
        FakeResizeObserver.instances = [];
    }

    public disconnect(): void {}

    public observe(target: Element): void {
        this.observed.add(target);
    }

    public unobserve(): void {}
}

@Component({
    imports: [ChartComponent, TreemapSeriesComponent],
    template: `
        <mona-chart #chart [style.width.px]="600" [style.height.px]="400" style="display: block;">
            <mona-treemap-series [data]="data" field="value" labelField="name" />
        </mona-chart>
    `
})
class ResizableTreemapHostComponent {
    public readonly chart = viewChild.required<ChartComponent>("chart");
    public readonly data = [
        { name: "A", value: 40 },
        { name: "B", value: 60 }
    ];
}

@Component({
    imports: [ChartComponent, GaugeSeriesComponent],
    template: `
        <mona-chart #chart [style.width.px]="600" [style.height.px]="400" style="display: block;">
            <mona-gauge-series [value]="65" [min]="0" [max]="100" />
        </mona-chart>
    `
})
class ResizableGaugeHostComponent {
    public readonly chart = viewChild.required<ChartComponent>("chart");
}

function findPlotResizeObserver(): FakeResizeObserver {
    const observer = FakeResizeObserver.instances.find(instance =>
        [...instance.observed].some(element => element.classList.contains("min-h-0"))
    );
    if (!observer) {
        throw new Error("The chart surface resize observer was not registered");
    }
    return observer;
}

describe("Non-Cartesian chart resize lifecycle", () => {
    let originalResizeObserver: typeof ResizeObserver | undefined;

    beforeEach(() => {
        FakeResizeObserver.reset();
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
        vi.restoreAllMocks();
    });

    it("rebuilds the treemap scene on a size-only invalidation, without needing a structural change", async () => {
        await TestBed.configureTestingModule({ imports: [ResizableTreemapHostComponent] }).compileComponents();
        const fixture: ComponentFixture<ResizableTreemapHostComponent> =
            TestBed.createComponent(ResizableTreemapHostComponent);
        const host = fixture.componentInstance;
        fixture.detectChanges();

        const initialWidth = host.chart().scene()?.width;
        expect(initialWidth).toBeGreaterThan(0);
        const resizedWidth = (initialWidth ?? 0) + 300;

        const resizeObserver = findPlotResizeObserver();
        resizeObserver.callback(
            [{ contentRect: { height: 500, width: resizedWidth } } as ResizeObserverEntry],
            resizeObserver as unknown as ResizeObserver
        );
        host.chart().recomputeScene(ChartInvalidationReason.Size);
        fixture.detectChanges();

        expect(host.chart().scene()?.width).toBe(resizedWidth);
    });

    it("rebuilds the gauge scene on a size-only invalidation, without needing a structural change", async () => {
        await TestBed.configureTestingModule({ imports: [ResizableGaugeHostComponent] }).compileComponents();
        const fixture: ComponentFixture<ResizableGaugeHostComponent> =
            TestBed.createComponent(ResizableGaugeHostComponent);
        const host = fixture.componentInstance;
        fixture.detectChanges();

        const initialWidth = host.chart().scene()?.width;
        expect(initialWidth).toBeGreaterThan(0);
        const resizedWidth = (initialWidth ?? 0) + 300;

        const resizeObserver = findPlotResizeObserver();
        resizeObserver.callback(
            [{ contentRect: { height: 500, width: resizedWidth } } as ResizeObserverEntry],
            resizeObserver as unknown as ResizeObserver
        );
        host.chart().recomputeScene(ChartInvalidationReason.Size);
        fixture.detectChanges();

        expect(host.chart().scene()?.width).toBe(resizedWidth);
    });
});
