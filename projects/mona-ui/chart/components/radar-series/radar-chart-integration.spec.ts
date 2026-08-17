import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartPointEvent, ChartPointFocusEvent } from "../../models/chart-event.models";
import type { ChartRadialCurve, ChartRadialFillMode, ChartRadialGridShape } from "../../models/chart-polar.models";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { PolarAxisChartScene } from "../../internal/scene/chart-scene";
import { MonaChartAngularAxisComponent } from "../chart-angular-axis/chart-angular-axis.component";
import { MonaChartLegendComponent } from "../chart-legend/chart-legend.component";
import { MonaChartRadialAxisComponent } from "../chart-radial-axis/chart-radial-axis.component";
import { MonaChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaRadarSeriesComponent } from "./radar-series.component";

interface CharacterStat {
    metric: string;
    warrior: number;
    mage: number;
}

@Component({
    imports: [
        MonaChartComponent,
        MonaRadarSeriesComponent,
        MonaChartAngularAxisComponent,
        MonaChartRadialAxisComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            (pointClick)="onPointClick($event)"
            (pointFocusChange)="onPointFocusChange($event)">
            <mona-chart-angular-axis
                [rotation]="angularRotation()"
                [visible]="angularAxisVisible()" />
            <mona-chart-radial-axis
                [min]="radialMin()"
                [max]="radialMax()"
                [gridShape]="radialGridShape()"
                [visible]="radialAxisVisible()" />

            <mona-radar-series
                field="warrior"
                categoryField="metric"
                name="Warrior"
                [fillMode]="fillMode()"
                [curve]="curve()"
                [showPoints]="showPoints()"
                [(visible)]="warriorVisible" />

            <mona-radar-series
                field="mage"
                categoryField="metric"
                name="Mage"
                [fillMode]="fillMode()"
                [curve]="curve()"
                [showPoints]="showPoints()"
                [(visible)]="mageVisible" />

            <mona-chart-legend position="bottom" />
            <mona-chart-tooltip [shared]="tooltipShared()" />
        </mona-chart>
    `
})
class RadarChartTestHostComponent {
    public readonly angularAxisVisible = signal(true);
    public readonly angularRotation = signal(0);
    public readonly curve = signal<ChartRadialCurve>("linear");
    public readonly data = signal<CharacterStat[]>([
        { metric: "Strength", warrior: 90, mage: 30 },
        { metric: "Intelligence", warrior: 40, mage: 95 },
        { metric: "Agility", warrior: 75, mage: 60 },
        { metric: "Defense", warrior: 85, mage: 40 },
        { metric: "Mana", warrior: 20, mage: 100 }
    ]);
    public readonly fillMode = signal<ChartRadialFillMode>("gradient");
    public readonly mageVisible = signal(true);
    public readonly radialAxisVisible = signal(true);
    public readonly radialGridShape = signal<ChartRadialGridShape>("polygon");
    public readonly radialMax = signal<number | undefined>(undefined);
    public readonly radialMin = signal<number | undefined>(0);
    public readonly showPoints = signal(true);
    public readonly tooltipShared = signal(true);
    public readonly warriorVisible = signal(true);

    public lastPointClick: ChartPointEvent | null = null;
    public lastPointFocus: ChartPointFocusEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.lastPointFocus = event;
    }
}

describe("Radar Chart Integration", () => {
    let fixture: ComponentFixture<RadarChartTestHostComponent>;
    let host: RadarChartTestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RadarChartTestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RadarChartTestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should compute polar axis scene for radar chart with 2 series and 5 categories", () => {
        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent))
            .componentInstance as MonaChartComponent;
        const scene = chartComp.scene() as PolarAxisChartScene;

        expect(scene).not.toBeNull();
        expect(scene.coordinateSystem).toBe("polar");
        expect(scene.polarKind).toBe("axis");
        expect(scene.axisMode).toBe("radar");
        expect(scene.series.length).toBe(2);
        expect(scene.angularAxis.ticks.length).toBe(5);
        expect(scene.angularAxis.ticks.map(t => t.formattedValue)).toEqual([
            "Strength",
            "Intelligence",
            "Agility",
            "Defense",
            "Mana"
        ]);
        expect(scene.radialAxis.gridShape).toBe("polygon");
        expect(scene.legendItems.length).toBe(2);
        expect(scene.legendItems.map(l => l.name)).toEqual(["Warrior", "Mage"]);
    });

    it("should render series-level legend items and toggle series visibility", () => {
        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent))
            .componentInstance as MonaChartComponent;
        const legendButtons = fixture.debugElement.queryAll(By.css("mona-chart-legend button"));

        expect(legendButtons.length).toBe(2);
        expect(legendButtons[0].nativeElement.textContent).toContain("Warrior");
        expect(legendButtons[1].nativeElement.textContent).toContain("Mage");

        // Click Warrior legend item to toggle visibility
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        chartComp.recomputeScene();

        expect(host.warriorVisible()).toBe(false);

        const scene = chartComp.scene() as PolarAxisChartScene;
        // Warrior series is hidden, so it must be removed from scene.series and hitTargets
        expect(scene.series.length).toBe(1);
        expect(scene.series[0].name).toBe("Mage");
        expect(scene.hitTargets.every(h => h.seriesName === "Mage")).toBe(true);
        expect(scene.legendItems.find(l => l.name === "Warrior")?.visible).toBe(false);
        expect(scene.legendItems.find(l => l.name === "Mage")?.visible).toBe(true);

        // Click Warrior legend item again to toggle back on
        legendButtons[0].nativeElement.click();
        fixture.detectChanges();
        chartComp.recomputeScene();

        expect(host.warriorVisible()).toBe(true);
        const sceneAfter = chartComp.scene() as PolarAxisChartScene;
        expect(sceneAfter.series.length).toBe(2);
        expect(sceneAfter.legendItems.find(l => l.name === "Warrior")?.visible).toBe(true);
    });

    it("should support keyboard navigation across angular spokes and series switching", () => {
        const chartEl = fixture.debugElement.query(By.directive(MonaChartComponent));

        // ArrowRight: navigate to first spoke ("Strength")
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        expect(host.lastPointFocus).not.toBeNull();
        expect(host.lastPointFocus?.category).toBe("Strength");
        expect(host.lastPointFocus?.seriesName).toBe("Warrior");

        // ArrowDown: switch series at current spoke to "Mage"
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        fixture.detectChanges();

        expect(host.lastPointFocus?.seriesName).toBe("Mage");
        expect(host.lastPointFocus?.category).toBe("Strength");

        // ArrowRight: navigate to next spoke ("Intelligence")
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();

        expect(host.lastPointFocus?.category).toBe("Intelligence");
        expect(host.lastPointFocus?.seriesName).toBe("Mage");

        // Enter: trigger pointClick
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        fixture.detectChanges();

        expect(host.lastPointClick).not.toBeNull();
        expect(host.lastPointClick?.category).toBe("Intelligence");
        expect(host.lastPointClick?.seriesName).toBe("Mage");
        expect(host.lastPointClick?.yValue).toBe(95);
    });

    it("should trigger animation when there is only one radar series and data updates", () => {
        // Leave only warrior series visible
        host.mageVisible.set(false);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent))
            .componentInstance as MonaChartComponent;
        chartComp.recomputeScene();

        const sceneBefore = chartComp.scene() as PolarAxisChartScene;
        expect(sceneBefore.series.length).toBe(1);

        // Update data
        host.data.set([
            { metric: "Strength", warrior: 100, mage: 0 },
            { metric: "Intelligence", warrior: 60, mage: 0 },
            { metric: "Agility", warrior: 80, mage: 0 },
            { metric: "Defense", warrior: 90, mage: 0 },
            { metric: "Mana", warrior: 50, mage: 0 }
        ]);
        fixture.detectChanges();
        chartComp.recomputeScene(ChartInvalidationReason.Data);

        expect(chartComp.isAnimating()).toBe(true);
    });

    it("should trigger animation when toggling legend items", () => {
        const chartComp = fixture.debugElement.query(By.directive(MonaChartComponent))
            .componentInstance as MonaChartComponent;
        chartComp.recomputeScene();

        const scene = chartComp.scene() as PolarAxisChartScene;
        expect(scene.series.length).toBe(2);

        const legendItem = scene.legendItems.find(l => l.name === "Mage");
        expect(legendItem).toBeDefined();

        chartComp.toggleLegendItem(legendItem!);
        fixture.detectChanges();
        chartComp.recomputeScene(ChartInvalidationReason.Visibility);

        expect(chartComp.isAnimating()).toBe(true);
    });

    it("should render distinct positions for top angular category label and outer radial tick label", () => {
        fixture.detectChanges();
        const angularLabels = fixture.debugElement.queryAll(By.css("div.text-foreground"));
        const radialLabels = fixture.debugElement.queryAll(By.css("div.text-muted-foreground"));

        const strengthLabel = angularLabels.find(el => el.nativeElement.textContent.trim() === "Strength");
        const maxRadialLabel = radialLabels.find(el => el.nativeElement.textContent.trim() === "100");

        expect(strengthLabel).toBeDefined();
        expect(maxRadialLabel).toBeDefined();

        const strengthLeft = parseFloat(strengthLabel!.nativeElement.style.left);
        const strengthTop = parseFloat(strengthLabel!.nativeElement.style.top);
        const maxRadialLeft = parseFloat(maxRadialLabel!.nativeElement.style.left);
        const maxRadialTop = parseFloat(maxRadialLabel!.nativeElement.style.top);

        // Max radial label is offset horizontally to the right of the vertical spoke on the ring,
        // while Strength is centered horizontally above the vertex
        expect(maxRadialLeft).toBeGreaterThan(strengthLeft);
        expect(maxRadialTop).toBeGreaterThan(strengthTop);
        expect(strengthLabel!.nativeElement.style.transform).toBe("translate(-50%, -100%)");
        expect(maxRadialLabel!.nativeElement.style.transform).toBe("translate(0, -50%)");
    });
});
