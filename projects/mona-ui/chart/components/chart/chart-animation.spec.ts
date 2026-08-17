import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { MonaBarSeriesComponent } from "../bar-series/bar-series.component";
import { MonaLineSeriesComponent } from "../line-series/line-series.component";
import { MonaChartComponent } from "./chart.component";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAnimationInput } from "../../models/chart-animation.models";

@Component({
    imports: [MonaChartComponent, MonaBarSeriesComponent, MonaLineSeriesComponent],
    template: `
        <mona-chart [data]="data()" [animation]="animation()" xField="category">
            @if (showBar()) {
                <mona-bar-series field="val1" name="Series 1" [keyField]="keyField()" />
            }
            @if (showLine()) {
                <mona-line-series field="val2" name="Series 2" />
            }
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly animation = signal<ChartAnimationInput>(true);
    public readonly data = signal<any[]>([
        { category: "A", id: "k1", val1: 10, val2: 20 },
        { category: "B", id: "k2", val1: 30, val2: 40 }
    ]);
    public readonly keyField = signal<string | undefined>("id");
    public readonly showBar = signal(true);
    public readonly showLine = signal(true);
}

describe("MonaChartComponent Animation Integration", () => {
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

    it("should accept animation input and normalize options", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        expect(chart).toBeTruthy();
        expect(chart.animation()).toBe(true);
        expect(chart.scene()).not.toBeNull();
    });

    it("should update CSS custom properties on the chart host", () => {
        host.animation.set({ duration: 600, easing: "ease-in" });
        fixture.detectChanges();

        const chartEl: HTMLElement = fixture.nativeElement.querySelector("mona-chart");
        expect(chartEl.style.getPropertyValue("--mona-chart-animation-duration")).toBe("600ms");
    });

    it("should compute valid scenes with animation keys on marks", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        const scene = chart.scene();
        expect(scene).not.toBeNull();

        if (scene && scene.coordinateSystem === "cartesian") {
            const barSeries = scene.series.find(s => s.type === "bar");
            expect(barSeries).toBeTruthy();
            if (barSeries && barSeries.type === "bar") {
                expect(barSeries.bars[0].animationKey).toBeDefined();
            }
        }
    });

    it("should handle dynamic animation disabling", () => {
        host.animation.set(false);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        host.data.set([
            { category: "A", id: "k1", val1: 50, val2: 60 }
        ]);
        fixture.detectChanges();

        expect(chart.isAnimating()).toBe(false);
    });

    it("should trigger animation when only one series is present", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        expect(chart).toBeTruthy();

        // Trigger data update with animation enabled
        host.animation.set(true);
        host.data.set([
            { category: "A", id: "k1", val1: 80, val2: 90 },
            { category: "B", id: "k2", val1: 100, val2: 110 }
        ]);
        fixture.detectChanges();
        chart.recomputeScene(ChartInvalidationReason.Data);

        expect(chart.isAnimating()).toBe(true);
    });

    it("should animate when removing the last series (1 -> 0) and adding the first series (0 -> 1)", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();

        // 2 -> 1 series
        host.showBar.set(false);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);

        // Finish 2 -> 1 animation
        chart.recomputeScene();

        // 1 -> 0 series (last series removed)
        host.showLine.set(false);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);

        // Finish 1 -> 0 animation
        chart.recomputeScene();
        expect(chart.scene()?.series.length).toBe(0);

        // 0 -> 1 series (first series added from empty)
        host.showBar.set(true);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);

        // Finish 0 -> 1 animation
        chart.recomputeScene();

        // 1 -> 2 series (second series added)
        host.showLine.set(true);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);
    });

    it("should not cut a structural animation short when a passive layout/size reflow arrives mid-flight", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();

        // 2 -> 1 series, leaving the last series in flight
        host.showBar.set(false);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);

        // 1 -> 0 series (last series removed) starts a structural exit animation
        host.showLine.set(false);
        fixture.detectChanges();
        expect(chart.isAnimating()).toBe(true);

        // Simulate a passive reflow (e.g. the legend collapsing as it goes to
        // zero items) firing mid-animation via ResizeObserver. This must not
        // cancel the in-progress exit animation.
        chart.recomputeScene(ChartInvalidationReason.Size);
        expect(chart.isAnimating()).toBe(true);

        // Finish the exit animation
        chart.recomputeScene();
        expect(chart.scene()?.series.length).toBe(0);
    });
});
