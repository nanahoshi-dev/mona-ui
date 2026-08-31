import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { DonutSeriesComponent } from "../components/donut-series/donut-series.component";
import { ChartCenterTemplateDirective } from "../directives/chart-center-template.directive";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";

class FakeResizeObserver {
    public readonly observed = new Set<Element>();
    public static instances: FakeResizeObserver[] = [];

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

    public unobserve(target: Element): void {
        this.observed.delete(target);
    }
}

@Component({
    imports: [ChartCenterTemplateDirective, ChartComponent, DonutSeriesComponent],
    template: `
        @if (showChart()) {
            <div class="donut-shell">
                <mona-chart
                    class="h-full w-full"
                    renderer="svg"
                    aria-label="Review forecast"
                    [animation]="animationEnabled()"
                    [data]="data">
                    <mona-donut-series
                        field="reviewCount"
                        categoryField="languageName"
                        colorField="color"
                        [innerRadiusRatio]="0.67"
                        [outerRadiusRatio]="0.92"
                        [padAngle]="1.5"
                        [cornerRadius]="2"
                        [showLabels]="false">
                        <ng-template monaChartCenterTemplate>
                            <span>87 reviews</span>
                        </ng-template>
                    </mona-donut-series>
                </mona-chart>
            </div>
        }
    `
})
class LazyDonutChartHostComponent {
    public readonly animationEnabled = signal(true);
    public readonly chart = viewChild.required<ChartComponent>(ChartComponent);
    public readonly data = [
        { color: "#5b52a3", languageName: "Japanese", reviewCount: 78 },
        { color: "#1d3f75", languageName: "Spanish (Castilian)", reviewCount: 9 },
        { color: "#234a38", languageName: "Others", reviewCount: 0 }
    ];
    public readonly layoutReady = signal(false);
    public readonly showChart = signal(false);
}

function rect(width: number, height: number): DOMRect {
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

function requireSvg(fixture: ComponentFixture<LazyDonutChartHostComponent>): SVGSVGElement {
    const svg = fixture.nativeElement.querySelector("svg") as SVGSVGElement | null;
    if (!svg) {
        throw new Error("Expected the SVG chart surface to be rendered");
    }
    return svg;
}

describe("Donut chart layout lifecycle", () => {
    let originalResizeObserver: typeof ResizeObserver | undefined;

    beforeEach(async () => {
        FakeResizeObserver.reset();
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        await TestBed.configureTestingModule({ imports: [LazyDonutChartHostComponent] }).compileComponents();
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
        vi.restoreAllMocks();
    });

    it("does not paint fallback donut geometry before its lazy container has a positive size", () => {
        const fixture = TestBed.createComponent(LazyDonutChartHostComponent);
        const host = fixture.componentInstance;
        const zeroRect = rect(0, 0);
        const settledRect = rect(160, 160);

        host.animationEnabled.set(false);
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() =>
            host.layoutReady() ? settledRect : zeroRect
        );

        fixture.detectChanges();
        host.showChart.set(true);
        fixture.detectChanges();

        const svg = requireSvg(fixture);
        expect(svg.querySelector("g[data-series-id] path")).toBeNull();

        host.layoutReady.set(true);
        const resizeObserver = findPlotResizeObserver();
        resizeObserver.callback(
            [{ contentRect: settledRect } as ResizeObserverEntry],
            resizeObserver as unknown as ResizeObserver
        );
        host.chart().recomputeScene(ChartInvalidationReason.Size);
        fixture.detectChanges();

        const slice = svg.querySelector("g[data-series-id] path");
        expect(svg.getAttribute("viewBox")).toBe("0 0 160 160");
        expect(slice?.getAttribute("transform")).toBe("translate(80, 80)");
    });

    it("commits settled donut geometry immediately when its lazy container resizes during enter animation", () => {
        const fixture = TestBed.createComponent(LazyDonutChartHostComponent);
        const host = fixture.componentInstance;
        const initialRect = rect(500, 300);
        const settledRect = rect(160, 160);

        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() =>
            host.layoutReady() ? settledRect : initialRect
        );

        fixture.detectChanges();
        host.showChart.set(true);
        fixture.detectChanges();

        host.layoutReady.set(true);
        const resizeObserver = findPlotResizeObserver();
        resizeObserver.callback(
            [{ contentRect: settledRect } as ResizeObserverEntry],
            resizeObserver as unknown as ResizeObserver
        );
        host.chart().recomputeScene(ChartInvalidationReason.Size);
        fixture.detectChanges();

        const svg = requireSvg(fixture);
        const slice = svg.querySelector("g[data-series-id] path");
        const center = fixture.nativeElement.querySelector(
            '[data-mona-chart-export-role="donut-center"]'
        ) as HTMLElement | null;

        expect(svg.getAttribute("width")).toBe("160");
        expect(svg.getAttribute("height")).toBe("160");
        expect(svg.getAttribute("viewBox")).toBe("0 0 160 160");
        expect(slice?.getAttribute("transform")).toBe("translate(80, 80)");
        expect(center?.style.left).toBe("80px");
        expect(center?.style.top).toBe("80px");
    });
});
