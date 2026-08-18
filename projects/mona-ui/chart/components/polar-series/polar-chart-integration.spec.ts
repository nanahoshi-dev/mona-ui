import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartPointEvent, ChartPointFocusEvent } from "../../models/chart-event.models";
import type { ChartRadialCurve, ChartRadialFillMode, ChartRadialGridShape } from "../../models/chart-polar.models";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { PolarAxisChartScene } from "../../internal/scene/chart-scene";
import { ChartAngularAxisComponent } from "../chart-angular-axis/chart-angular-axis.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartRadialAxisComponent } from "../chart-radial-axis/chart-radial-axis.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartComponent } from "../chart/chart.component";
import { PolarSeriesComponent } from "./polar-series.component";

interface AntennaMeasurement {
    angle: number;
    gain: number | null;
}

@Component({
    imports: [
        ChartComponent,
        PolarSeriesComponent,
        ChartAngularAxisComponent,
        ChartRadialAxisComponent,
        ChartLegendComponent,
        ChartTooltipComponent
    ],
    template: `
        <mona-chart [data]="data()" (pointClick)="onPointClick($event)" (pointFocusChange)="onPointFocusChange($event)">
            <mona-chart-angular-axis
                [rotation]="angularRotation()"
                [tickCount]="angularTickCount()"
                [visible]="angularAxisVisible()" />
            <mona-chart-radial-axis
                [min]="radialMin()"
                [max]="radialMax()"
                [gridShape]="radialGridShape()"
                [visible]="radialAxisVisible()" />

            <mona-polar-series
                field="gain"
                angleField="angle"
                name="Radiation Pattern"
                [fillMode]="fillMode()"
                [curve]="curve()"
                [connectNulls]="connectNulls()"
                [showPoints]="showPoints()"
                [(visible)]="seriesVisible" />

            <mona-chart-legend position="bottom" />
            <mona-chart-tooltip />
        </mona-chart>
    `
})
class PolarChartTestHostComponent {
    public readonly angularAxisVisible = signal(true);
    public readonly angularRotation = signal(0);
    public readonly angularTickCount = signal(12);
    public readonly connectNulls = signal(false);
    public readonly curve = signal<ChartRadialCurve>("smooth");
    public readonly data = signal<AntennaMeasurement[]>([
        { angle: 270, gain: 45 },
        { angle: 0, gain: 90 },
        { angle: 90, gain: 40 },
        { angle: 180, gain: 10 }
    ]);
    public readonly fillMode = signal<ChartRadialFillMode>("gradient");
    public readonly radialAxisVisible = signal(true);
    public readonly radialGridShape = signal<ChartRadialGridShape>("circle");
    public readonly radialMax = signal<number | undefined>(100);
    public readonly radialMin = signal<number | undefined>(0);
    public readonly seriesVisible = signal(true);
    public readonly showPoints = signal(true);

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.lastPointFocus = event;
    }
}

describe("Continuous Polar Chart Integration", () => {
    let fixture: ComponentFixture<PolarChartTestHostComponent>;
    let host: PolarChartTestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PolarChartTestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PolarChartTestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should compute polar axis scene with continuous sorted angles and circular grid", () => {
        const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const scene = chartComp.scene() as PolarAxisChartScene;

        expect(scene).not.toBeNull();
        expect(scene.coordinateSystem).toBe("polar");
        expect(scene.polarKind).toBe("axis");
        expect(scene.axisMode).toBe("polar");
        expect(scene.angularAxis.ticks.length).toBe(12);
        expect(scene.radialAxis.gridShape).toBe("circle");
        expect(scene.radialAxis.domain).toEqual([0, 100]);

        // Points should be stably sorted by normalized angle ascending: 0, 90, 180, 270
        const points = scene.series[0].points;
        expect(points.map(p => p.normalizedAngle)).toEqual([0, 90, 180, 270]);
        expect(points.map(p => p.value)).toEqual([90, 40, 10, 45]);
    });

    it("should navigate continuous polar points with keyboard arrow keys and trigger click", () => {
        const chartEl = fixture.debugElement.query(By.directive(ChartComponent));

        // ArrowRight: navigate to 0°
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        expect(host.lastPointFocus).not.toBeNull();
        expect(host.lastPointFocus?.category).toBe("0°");
        expect(host.lastPointFocus?.yValue).toBe(90);

        // ArrowRight: navigate to 90°
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        expect(host.lastPointFocus?.category).toBe("90°");
        expect(host.lastPointFocus?.yValue).toBe(40);

        // Enter: trigger click
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        fixture.detectChanges();

        expect(host.lastPointClick).not.toBeNull();
        expect(host.lastPointClick?.category).toBe("90°");
        expect(host.lastPointClick?.yValue).toBe(40);
    });

    it("should toggle continuous polar series visibility from legend", () => {
        const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));

        expect(legendButtons.length).toBe(1);
        expect(legendButtons[0].nativeElement.textContent).toContain("Radiation Pattern");

        // Toggle series off
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        chartComp.recomputeScene();

        expect(host.seriesVisible()).toBe(false);
        const scene = chartComp.scene() as PolarAxisChartScene;
        expect(scene.series.length).toBe(0);
        expect(scene.hitTargets.length).toBe(0);
        expect(scene.legendItems[0].visible).toBe(false);

        // Toggle series back on
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        chartComp.recomputeScene();

        expect(host.seriesVisible()).toBe(true);
        const sceneAfter = chartComp.scene() as PolarAxisChartScene;
        expect(sceneAfter.series.length).toBe(1);
        expect(sceneAfter.hitTargets.length).toBe(4);
        expect(sceneAfter.legendItems[0].visible).toBe(true);
    });

    it("should trigger visibility animation when toggling continuous polar series from legend", () => {
        const chartComp = fixture.debugElement.query(By.directive(ChartComponent)).componentInstance as ChartComponent;
        chartComp.recomputeScene();

        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));
        expect(legendButtons.length).toBe(1);

        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        chartComp.recomputeScene(ChartInvalidationReason.Visibility);

        expect(chartComp.isAnimating()).toBe(true);
    });
});
