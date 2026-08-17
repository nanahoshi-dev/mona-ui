import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { MonaBarSeriesComponent } from "../bar-series/bar-series.component";
import { MonaLineSeriesComponent } from "../line-series/line-series.component";
import { MonaChartComponent } from "./chart.component";
import type { ChartAnimationInput } from "../../models/chart-animation.models";

@Component({
    imports: [MonaChartComponent, MonaBarSeriesComponent, MonaLineSeriesComponent],
    template: `
        <mona-chart [data]="data()" [animation]="animation()" xField="category">
            <mona-bar-series field="val1" name="Series 1" [keyField]="keyField()" />
            <mona-line-series field="val2" name="Series 2" />
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

        const chartEl = fixture.debugElement.children[0].nativeElement as HTMLElement;
        expect(chartEl.style.getPropertyValue("--mona-chart-animation-duration")).toBe("600ms");
        expect(chartEl.style.getPropertyValue("--mona-chart-animation-easing")).toBe("cubic-bezier(0.4, 0, 1, 1)");
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
});
