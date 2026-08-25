import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { GaugeSeriesComponent } from "../components/gauge-series/gauge-series.component";

@Component({
    imports: [ChartComponent, GaugeSeriesComponent],
    template: `
        @if (showChart()) {
            <div class="gauge-shell">
                <mona-chart renderer="svg" [animation]="{ duration: 1 }" aria-label="Completion gauge">
                    <mona-gauge-series [value]="65" [min]="0" [max]="100" indicator="both" [showValue]="true" />
                </mona-chart>
            </div>
        }
    `
})
class LazyGaugeChartHostComponent {
    public readonly layoutReady = signal(false);
    public readonly showChart = signal(false);
}

function nextAnimationFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

describe("Gauge chart layout lifecycle", () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LazyGaugeChartHostComponent]
        }).compileComponents();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("re-measures a lazily mounted SVG gauge after its first layout is zero-sized", async () => {
        const fixture: ComponentFixture<LazyGaugeChartHostComponent> =
            TestBed.createComponent(LazyGaugeChartHostComponent);
        const host = fixture.componentInstance;
        const zeroRect = {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect;
        const finalRect = {
            bottom: 128,
            height: 128,
            left: 0,
            right: 128,
            top: 0,
            width: 128,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect;

        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() =>
            host.layoutReady() ? finalRect : zeroRect
        );

        fixture.detectChanges();
        host.showChart.set(true);
        fixture.detectChanges();

        // The chart is created before its tab/card layout has settled.
        host.layoutReady.set(true);
        for (let frame = 0; frame < 8; frame++) {
            await nextAnimationFrame();
        }

        const svg = fixture.nativeElement.querySelector("svg") as SVGSVGElement | null;
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute("width")).toBe("128");
        expect(svg?.getAttribute("height")).toBe("128");
        expect(svg?.getAttribute("viewBox")).toBe("0 0 128 128");

        const gaugeGroup = svg?.querySelector("g[data-series-id]");
        expect(gaugeGroup?.getAttribute("opacity")).toBe("1");
    });
});
