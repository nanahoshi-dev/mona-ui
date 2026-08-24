import { Component, signal } from "@angular/core";
import {  TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it } from "vitest";
import type { PolarArcChartScene } from "../../internal/scene/polar-arc-scene";
import { ChartAngularAxisComponent } from "../chart-angular-axis/chart-angular-axis.component";
import { ChartRadialAxisComponent } from "../chart-radial-axis/chart-radial-axis.component";
import { ChartComponent } from "./chart.component";
import { RadialBarSeriesComponent } from "../radial-bar-series/radial-bar-series.component";
import { RoseSeriesComponent } from "../rose-series/rose-series.component";
import { GaugeSeriesComponent } from "../gauge-series/gauge-series.component";
import { ChartGaugeCenterTemplateDirective } from "../../directives/chart-gauge-center-template.directive";

@Component({
    imports: [ChartComponent, RadialBarSeriesComponent],
    template: `
        <div style="width: 400px; height: 400px;">
            <mona-chart>
                <mona-radial-bar-series [data]="data()" categoryField="category" field="value" [visible]="visible()" />
            </mona-chart>
        </div>
    `
})
class TestRadialBarChartHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "Alpha", value: 30 },
        { category: "Beta", value: 80 }
    ]);
    public readonly visible = signal(true);
}

@Component({
    imports: [ChartComponent, RoseSeriesComponent, ChartAngularAxisComponent, ChartRadialAxisComponent],
    template: `
        <div style="width: 400px; height: 400px;">
            <mona-chart>
                <mona-chart-angular-axis [labels]="true" [gridLines]="true" />
                <mona-chart-radial-axis [min]="0" [max]="100" [labels]="true" [gridLines]="true" />
                <mona-rose-series [data]="data()" categoryField="category" field="value" [visible]="visible()" />
            </mona-chart>
        </div>
    `
})
class TestRoseChartHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "North", value: 40 },
        { category: "East", value: 80 },
        { category: "South", value: 60 },
        { category: "West", value: 100 }
    ]);
    public readonly visible = signal(true);
}

@Component({
    imports: [ChartComponent, GaugeSeriesComponent, ChartGaugeCenterTemplateDirective],
    template: `
        <div style="width: 400px; height: 400px;">
            <mona-chart>
                <mona-gauge-series [value]="value()" [min]="0" [max]="100" [indicator]="'both'" [visible]="visible()">
                    <ng-template monaChartGaugeCenterTemplate let-val let-ratio="ratio">
                        <span class="gauge-center-text">{{ val }} ({{ ratio * 100 }}%)</span>
                    </ng-template>
                </mona-gauge-series>
            </mona-chart>
        </div>
    `
})
class TestGaugeChartHostComponent {
    public readonly value = signal<number | undefined>(65);
    public readonly visible = signal(true);
}

describe("Chart Radial Arc Series Integration", () => {
    describe("Radial Bar Series Integration", () => {
        it("renders radial bar chart scene and responds to visibility changes", () => {
            TestBed.configureTestingModule({
                imports: [TestRadialBarChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestRadialBarChartHostComponent);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            expect(scene).not.toBeNull();
            expect(scene.coordinateSystem).toBe("polar");
            expect(scene.polarKind).toBe("arc");
            expect(scene.arcMode).toBe("radialBar");
            expect(scene.hasRenderableData).toBe(true);
            expect(scene.hitTargets.length).toBe(2);

            // Hide series
            fixture.componentInstance.visible.set(false);
            fixture.detectChanges();
            chartComp.recomputeScene();

            const hiddenScene = chartComp.scene() as PolarArcChartScene;
            expect(hiddenScene.hasRenderableData).toBe(false);
            expect(hiddenScene.hitTargets.length).toBe(0);
        });

        it("assigns stable animationKey and itemId to tracks", () => {
            TestBed.configureTestingModule({
                imports: [TestRadialBarChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestRadialBarChartHostComponent);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            const series0 = scene.series[0];
            if (series0.type === "radialBar") {
                expect(series0.tracks.length).toBe(2);
                expect(series0.tracks[0].itemId).toBeDefined();
                expect(series0.tracks[0].animationKey).toContain("track");
            }
        });
    });

    describe("Rose Series Integration", () => {
        it("renders rose chart with angular and radial axes labels and grid", () => {
            TestBed.configureTestingModule({
                imports: [TestRoseChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestRoseChartHostComponent);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            expect(scene).not.toBeNull();
            expect(scene.coordinateSystem).toBe("polar");
            expect(scene.polarKind).toBe("arc");
            expect(scene.arcMode).toBe("rose");
            expect(scene.hasRenderableData).toBe(true);
            expect(scene.hitTargets.length).toBe(4);
            expect(scene.angularAxis).toBeDefined();
            expect(scene.radialAxis).toBeDefined();
        });

        it("stabilizes category slots when duplicate category rows have invalid first values but valid later values", () => {
            TestBed.configureTestingModule({
                imports: [TestRoseChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestRoseChartHostComponent);
            // First North row is negative (invalid), second North row has valid 75
            fixture.componentInstance.data.set([
                { category: "North", value: -10 },
                { category: "South", value: 50 },
                { category: "North", value: 75 }
            ]);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            expect(scene.hitTargets.length).toBe(2);
            const northTarget = scene.hitTargets.find(t => t.category === "North");
            expect(northTarget).toBeDefined();
            expect(northTarget?.value).toBe(75);
            expect(northTarget?.categoryIndex).toBe(0);
        });
    });

    describe("Gauge Series Integration", () => {
        it("renders gauge chart and projects center template", () => {
            TestBed.configureTestingModule({
                imports: [TestGaugeChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestGaugeChartHostComponent);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            expect(scene).not.toBeNull();
            expect(scene.coordinateSystem).toBe("polar");
            expect(scene.polarKind).toBe("arc");
            expect(scene.arcMode).toBe("gauge");
            expect(scene.hasRenderableData).toBe(true);
            expect(scene.hitTargets.length).toBe(1);

            // Verify center template projection
            const centerEl = fixture.nativeElement.querySelector(".gauge-center-text");
            expect(centerEl).not.toBeNull();
            expect(centerEl?.textContent).toContain("65 (65%)");
        });

        it("normalizes direct gauge value dataIndex to 0 and datum to undefined", () => {
            TestBed.configureTestingModule({
                imports: [TestGaugeChartHostComponent]
            });

            const fixture = TestBed.createComponent(TestGaugeChartHostComponent);
            fixture.detectChanges();

            const chartComp = fixture.debugElement.query(By.directive(ChartComponent))
                .componentInstance as ChartComponent;
            chartComp.recomputeScene();

            const scene = chartComp.scene() as PolarArcChartScene;
            const target = scene.hitTargets[0];
            expect(target.dataIndex).toBe(0);
            expect(target.datum).toBeUndefined();
        });
    });
});
