import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";
import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";
import { ChartMarkIdentityResolver } from "../../internal/interaction/chart-mark-identity-resolver";
import { resolveDenseMarkById } from "../../internal/density/cartesian-dense-selection";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ScatterSeriesComponent } from "../scatter-series/scatter-series.component";
import { ChartComponent } from "./chart.component";

@Component({
    imports: [
        ChartComponent,
        ChartBrushComponent,
        ChartSelectionComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ScatterSeriesComponent
    ],
    template: `
        <mona-chart
            #chart
            [animation]="false"
            [data]="data()"
            [downsampling]="downsampling()"
            xField="x"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-scatter-series xAxisId="x-main" yAxisId="y-main" xField="x" field="y" name="S" />
            <mona-chart-selection mode="single" (selectionChange)="onSelectionChange($event)" />
            <mona-chart-brush
                [activation]="'drag'"
                [selectionBehavior]="'replace'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class DensityBrushHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal<readonly { readonly x: number; readonly y: number }[]>([]);
    public readonly downsampling = signal<ChartDownsamplingInput>(false);
    public brushEvents: ChartBrushChangeEvent[] = [];
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onBrushChange(event: ChartBrushChangeEvent): void {
        this.brushEvents.push(event);
    }

    public onSelectionChange(event: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(event);
    }
}

@Component({
    imports: [
        ChartComponent,
        ChartBrushComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ScatterSeriesComponent
    ],
    template: `
        <mona-chart
            #chart
            [animation]="false"
            [data]="[]"
            [downsampling]="downsampling()"
            xField="x"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-scatter-series
                [data]="zData()"
                xAxisId="x-main"
                yAxisId="y-main"
                xField="x"
                field="y"
                name="z-series"
                seriesKey="z-series" />
            <mona-scatter-series
                [data]="aData()"
                xAxisId="x-main"
                yAxisId="y-main"
                xField="x"
                field="y"
                name="a-series"
                seriesKey="a-series" />
            <mona-chart-brush
                [activation]="'drag'"
                [selectionBehavior]="'none'"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class CrossSeriesDensityBrushHostComponent {
    public readonly aData = signal<readonly { readonly x: number; readonly y: number }[]>([]);
    public readonly chart = viewChild.required(ChartComponent);
    public readonly downsampling = signal<ChartDownsamplingInput>({
        enabled: true,
        maxPoints: 8,
        samplesPerPixel: 1,
        threshold: 0
    });
    public readonly zData = signal<readonly { readonly x: number; readonly y: number }[]>([]);
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(event: ChartBrushChangeEvent): void {
        this.brushEvents.push(event);
    }
}

describe("Cartesian density brush parity", () => {
    let fixture: ComponentFixture<DensityBrushHostComponent>;
    let host: DensityBrushHostComponent;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect);

        await TestBed.configureTestingModule({ imports: [DensityBrushHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(DensityBrushHostComponent);
        host = fixture.componentInstance;
        host.data.set(
            Array.from({ length: 2_000 }, (_, index) => ({
                x: index,
                y: (index * 37) % 101
            }))
        );
        fixture.detectChanges();
        host.chart().flushPendingRender();
    });

    const brushOnePoint = (): void => {
        const scene = host.chart()["cartesianXYScene"]();
        const xSnap = scene?.coordinateSpace?.get({ axis: "x", axisId: "x-main" });
        const ySnap = scene?.coordinateSpace?.get({ axis: "y", axisId: "y-main" });
        const x = xSnap?.viewportScale.map(1_337);
        const y = ySnap?.viewportScale.map((1_337 * 37) % 101);
        expect(x).toBeDefined();
        expect(y).toBeDefined();

        const canvas = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        canvas.dispatchEvent(new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: x! - 8,
            clientY: y! - 8,
            pointerId: 1,
            pointerType: "mouse"
        }));
        canvas.dispatchEvent(new PointerEvent("pointermove", {
            bubbles: true,
            clientX: x! + 8,
            clientY: y! + 8,
            pointerId: 1,
            pointerType: "mouse"
        }));
        canvas.dispatchEvent(new PointerEvent("pointerup", {
            bubbles: true,
            clientX: x! + 8,
            clientY: y! + 8,
            pointerId: 1,
            pointerType: "mouse"
        }));
        fixture.detectChanges();
        host.chart().flushPendingRender();
    };

    it("keeps single-selection brush results identical with density disabled and enabled", () => {
        brushOnePoint();
        const fullEnd = host.brushEvents.filter(event => event.phase === "end").pop();
        const fullSelection = host.selectionEvents.filter(event => event.source === "brush").pop();

        host.brushEvents = [];
        host.selectionEvents = [];
        host.downsampling.set({ enabled: true, maxPoints: 8, samplesPerPixel: 1, threshold: 0 });
        fixture.detectChanges();
        host.chart().flushPendingRender();
        brushOnePoint();
        const denseEnd = host.brushEvents.filter(event => event.phase === "end").pop();
        const denseSelection = host.selectionEvents.filter(event => event.source === "brush").pop();
        const denseSelectedMarkIds = denseSelection?.selectedMarkIds ?? host.chart()["effectiveSelectedMarkIds"]();

        expect(fullEnd?.matchedMarkIds).toEqual(denseEnd?.matchedMarkIds);
        expect(fullSelection?.selectedMarkIds).toEqual(denseSelectedMarkIds);
        expect(denseSelectedMarkIds).toHaveLength(1);
    });
});

describe("Cartesian density cross-series brush parity", () => {
    let fixture: ComponentFixture<CrossSeriesDensityBrushHostComponent>;
    let host: CrossSeriesDensityBrushHostComponent;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect);

        await TestBed.configureTestingModule({ imports: [CrossSeriesDensityBrushHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(CrossSeriesDensityBrushHostComponent);
        host = fixture.componentInstance;
        host.zData.set(
            Array.from({ length: 2_000 }, (_, index) => ({
                x: index,
                y: (index * 37) % 101
            }))
        );
        host.aData.set([{ x: 1_337, y: (1_337 * 37) % 101 }]);
        fixture.detectChanges();
        host.chart().flushPendingRender();
    });

    it("orders raw-only z-series hits before sampled a-series hits", () => {
        const sceneValue = host.chart().scene();
        expect(sceneValue?.coordinateSystem).toBe("cartesian");
        expect((sceneValue as { readonly cartesianKind?: string } | null)?.cartesianKind).toBe("xy");
        const scene = sceneValue as CartesianXYChartScene;
        const zProvider = [...(scene.denseInteraction?.values() ?? [])].find(
            provider => provider.materializeAt(1_337)?.seriesName === "z-series"
        );
        const zTarget = zProvider?.materializeAt(1_337);
        const aTarget = scene.hitTargets.find(target => target.seriesName === "a-series");

        expect(zProvider).toBeDefined();
        expect(zTarget).toBeDefined();
        expect(aTarget).toBeDefined();

        const zMarkId = ChartMarkIdentityResolver.resolve(zTarget!);
        const aMarkId = ChartMarkIdentityResolver.resolve(aTarget!);
        expect(scene.hitTargets.some(target => ChartMarkIdentityResolver.resolve(target) === zMarkId)).toBe(false);
        expect(resolveDenseMarkById(scene, zMarkId)).not.toBeNull();

        const plotRect = scene!.plotRect;
        const canvas = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        canvas.dispatchEvent(new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: plotRect.x,
            clientY: plotRect.y,
            pointerId: 1,
            pointerType: "mouse"
        }));
        canvas.dispatchEvent(new PointerEvent("pointermove", {
            bubbles: true,
            clientX: plotRect.x + plotRect.width,
            clientY: plotRect.y + plotRect.height,
            pointerId: 1,
            pointerType: "mouse"
        }));
        canvas.dispatchEvent(new PointerEvent("pointerup", {
            bubbles: true,
            clientX: plotRect.x + plotRect.width,
            clientY: plotRect.y + plotRect.height,
            pointerId: 1,
            pointerType: "mouse"
        }));
        fixture.detectChanges();
        host.chart().flushPendingRender();

        const end = host.brushEvents.filter(event => event.phase === "end").pop();
        expect(end?.matchedMarkIds).toContain(zMarkId);
        expect(end?.matchedMarkIds).toContain(aMarkId);
        const zIndex = end?.matchedMarkIds?.indexOf(zMarkId) ?? -1;
        const aIndex = end?.matchedMarkIds?.indexOf(aMarkId) ?? -1;
        expect(zIndex).toBeGreaterThanOrEqual(0);
        expect(aIndex).toBeGreaterThan(zIndex);
    });
});
