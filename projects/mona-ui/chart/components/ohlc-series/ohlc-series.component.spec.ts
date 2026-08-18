import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ChartComponent } from "../chart/chart.component";
import { OhlcSeriesComponent } from "./ohlc-series.component";
import type { ChartOhlcSeriesScene } from "../../internal/scene/cartesian-scene";

@Component({
    imports: [ChartComponent, OhlcSeriesComponent],
    template: `
        <mona-chart [data]="data()" [xField]="'time'">
            <mona-ohlc-series
                [openField]="'o'"
                [highField]="'h'"
                [lowField]="'l'"
                [closeField]="'c'"
                [name]="seriesName()"
                [tickLength]="tickLength()"
                [wickWidth]="wickWidth()"
                [visible]="visible()" />
        </mona-chart>
    `
})
class TestOhlcHostComponent {
    public readonly data = signal<readonly Record<string, unknown>[]>([
        { c: 110, h: 115, l: 95, o: 100, time: "2026-01-01" },
        { c: 90, h: 112, l: 88, o: 108, time: "2026-01-02" }
    ]);
    public readonly seriesName = signal<string>("Bars");
    public readonly tickLength = signal<number | undefined>(8);
    public readonly wickWidth = signal<number>(2);
    public readonly visible = signal<boolean>(true);
}

describe("MonaOhlcSeriesComponent", () => {
    let fixture: ComponentFixture<TestOhlcHostComponent>;
    let host: TestOhlcHostComponent;

    it("should mount and produce OHLC scene with tickLength and directions", () => {
        TestBed.configureTestingModule({
            imports: [TestOhlcHostComponent]
        });

        fixture = TestBed.createComponent(TestOhlcHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene();
        expect(scene).toBeDefined();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(1);
            const seriesScene = scene.series[0] as ChartOhlcSeriesScene;
            expect(seriesScene.type).toBe("ohlc");
            expect(seriesScene.name).toBe("Bars");
            expect(seriesScene.marks.length).toBe(2);
            expect(seriesScene.marks[0].direction).toBe("rising");
            expect(seriesScene.marks[1].direction).toBe("falling");
            expect(seriesScene.marks[0].tickWidth).toBe(8);
        }
    });

    it("should update scene when visibility toggles", () => {
        TestBed.configureTestingModule({
            imports: [TestOhlcHostComponent]
        });

        fixture = TestBed.createComponent(TestOhlcHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();

        host.visible.set(false);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene();
        if (scene && scene.coordinateSystem === "cartesian") {
            expect(scene.series.length).toBe(0);
        }
    });
});
