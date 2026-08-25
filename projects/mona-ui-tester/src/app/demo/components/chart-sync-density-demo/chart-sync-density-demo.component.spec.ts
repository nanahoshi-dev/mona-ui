import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ChartComponent } from "@nanahoshi/mona-ui/chart";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartSyncDensityDemoComponent } from "./chart-sync-density-demo.component";

interface DemoScene {
    readonly axes: readonly unknown[];
    readonly densityRuntime?: { readonly seriesById: ReadonlyMap<string, unknown> };
    readonly hasRenderableData: boolean;
    readonly series: readonly unknown[];
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public observe(): void {}

    public unobserve(): void {}

    public disconnect(): void {}
}

describe("ChartSyncDensityDemoComponent", () => {
    let fixture: ReturnType<typeof TestBed.createComponent<ChartSyncDensityDemoComponent>>;
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
            imports: [ChartSyncDensityDemoComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ChartSyncDensityDemoComponent);
    });

    afterEach(() => {
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    const flushCharts = (): Array<{ index: number; scene: DemoScene | undefined }> => {
        fixture.detectChanges();
        const chartDebugElements = fixture.debugElement.queryAll(By.directive(ChartComponent));
        return chartDebugElements.map((debugEl, index) => {
            const chart = debugEl.injector.get(ChartComponent);
            chart.flushPendingRender();
            const scene = (chart as unknown as { cartesianXYScene: () => DemoScene | undefined }).cartesianXYScene();
            return { index, scene };
        });
    };

    it("renders all seven dense charts without runtime errors", () => {
        const charts = flushCharts();

        expect(charts.length).toBe(7);

        for (const { index, scene } of charts) {
            expect(scene, `chart ${index} scene`).toBeDefined();
            expect(scene?.hasRenderableData, `chart ${index} renderable`).toBe(true);
            expect(scene?.series.length ?? 0, `chart ${index} series count`).toBeGreaterThan(0);
            expect(scene?.axes.length ?? 0, `chart ${index} axes`).toBeGreaterThanOrEqual(2);
        }
    });

    it("builds density runtimes for the synchronized dashboard charts", () => {
        const charts = flushCharts();

        for (const { index, scene } of charts.slice(0, 3)) {
            expect(scene?.densityRuntime?.seriesById.size ?? 0, `chart ${index} density entries`).toBeGreaterThan(0);
        }
    });

    it("does not override the chart host flex layout", () => {
        fixture.detectChanges();
        const hosts = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>("mona-chart");
        for (const [index, host] of Array.from(hosts).entries()) {
            // The mona-chart host relies on its own `flex flex-col` layout classes; an inline
            // display override collapses the plot surface to zero height and blanks the chart.
            expect(host.style.display, `chart ${index} inline display`).not.toBe("block");
        }
    });
});
