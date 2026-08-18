import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ChartComponent } from "../chart/chart.component";
import { CandlestickSeriesComponent } from "./candlestick-series.component";
import type { ChartFinancialFillMode } from "../../models/chart-financial.models";
import type { ChartCandlestickSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [ChartComponent, CandlestickSeriesComponent],
    template: `
        <mona-chart [data]="data()" [xField]="'time'">
            <mona-candlestick-series
                [openField]="'o'"
                [highField]="'h'"
                [lowField]="'l'"
                [closeField]="'c'"
                [name]="seriesName()"
                [fillMode]="fillMode()"
                [bodyWidthRatio]="bodyWidthRatio()"
                [wickWidth]="wickWidth()"
                [visible]="visible()" />
        </mona-chart>
    `
})
class TestCandlestickHostComponent {
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { c: 110, h: 115, l: 95, o: 100, time: "2026-01-01" },
        { c: 90, h: 112, l: 88, o: 108, time: "2026-01-02" }
    ]);
    public readonly seriesName = signal<string>("Candles");
    public readonly fillMode = signal<ChartFinancialFillMode>("filled");
    public readonly bodyWidthRatio = signal<number>(0.8);
    public readonly wickWidth = signal<number>(2);
    public readonly visible = signal<boolean>(true);
}

describe("MonaCandlestickSeriesComponent", () => {
    let fixture: ComponentFixture<TestCandlestickHostComponent>;
    let host: TestCandlestickHostComponent;

    it("should mount and produce candlestick scene with configured properties", () => {
        TestBed.configureTestingModule({
            imports: [TestCandlestickHostComponent]
        });

        fixture = TestBed.createComponent(TestCandlestickHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(1);
            const seriesScene = scene.series[0] as ChartCandlestickSeriesScene;
            expect(seriesScene.type).toBe("candlestick");
            expect(seriesScene.name).toBe("Candles");
            expect(seriesScene.fillMode).toBe("filled");
            expect(seriesScene.marks.length).toBe(2);
            expect(seriesScene.marks[0].direction).toBe("rising");
            expect(seriesScene.marks[1].direction).toBe("falling");
        }
    });

    it("should update scene when fillMode or visibility changes", () => {
        TestBed.configureTestingModule({
            imports: [TestCandlestickHostComponent]
        });

        fixture = TestBed.createComponent(TestCandlestickHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();

        host.fillMode.set("hollow");
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        let scene = chart.scene();
        if (scene && scene.coordinateSystem === "cartesian") {
            const seriesScene = scene.series[0] as ChartCandlestickSeriesScene;
            expect(seriesScene.fillMode).toBe("hollow");
        }

        host.visible.set(false);
        fixture.detectChanges();

        scene = chart.scene();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(0);
        }
    });
});
