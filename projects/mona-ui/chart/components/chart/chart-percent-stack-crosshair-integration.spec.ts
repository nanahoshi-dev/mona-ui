import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartReferenceLineComponent } from "../chart-reference-line/chart-reference-line.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import type { ChartRenderOverlayState } from "../../internal/render/cartesian-chart-renderer";
import type { SceneHitTarget } from "../../internal/scene/scene-geometry";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartCrosshairComponent,
        ChartReferenceLineComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" style="width: 500px; height: 300px;">
            <mona-chart-x-axis axisId="x-main" field="category" type="category" />
            <mona-chart-y-axis axisId="y-main" />
            <mona-chart-crosshair mode="xy" snap="nearest" />
            <mona-chart-reference-line axis="y" [value]="50" />
            <mona-bar-series field="val1" name="Series 1" stack="pct" stackMode="percent" />
            <mona-bar-series field="val2" name="Series 2" stack="pct" stackMode="percent" />
        </mona-chart>
    `
})
class VerticalPercentStackHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { category: "Cat A", val1: 30, val2: 70 },
        { category: "Cat B", val1: 40, val2: 60 }
    ]);
}

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartCrosshairComponent,
        ChartReferenceLineComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" style="width: 500px; height: 300px;">
            <mona-chart-x-axis axisId="x-main" />
            <mona-chart-y-axis axisId="y-main" />
            <mona-chart-crosshair mode="xy" snap="nearest" />
            <mona-chart-reference-line axis="x" [value]="75" />
            <mona-bar-series [orientation]="'horizontal'" field="val1" name="Series 1" stack="pct" stackMode="percent" />
            <mona-bar-series [orientation]="'horizontal'" field="val2" name="Series 2" stack="pct" stackMode="percent" />
        </mona-chart>
    `
})
class HorizontalPercentStackHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { category: "Cat A", val1: 40, val2: 60 },
        { category: "Cat B", val1: 25, val2: 75 }
    ]);
}

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartCrosshairComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" style="width: 500px; height: 300px;">
            <mona-chart-x-axis axisId="x-main" field="category" type="category" />
            <mona-chart-y-axis axisId="y-main" />
            <mona-chart-crosshair mode="xy" snap="nearest" />
            <mona-bar-series field="pos" name="Pos Series" stack="mixed" stackMode="percent" />
            <mona-bar-series field="neg" name="Neg Series" stack="mixed" stackMode="percent" />
        </mona-chart>
    `
})
class NegativePercentStackHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { category: "Cat A", neg: -40, pos: 60 },
        { category: "Cat B", neg: -75, pos: 25 }
    ]);
}

describe("ChartPercentStackCrosshairIntegration (CAA-R6-004 / Gates G & Sections 46-48)", () => {
    let origGetContext: typeof HTMLCanvasElement.prototype.getContext | undefined;
    let globalRenderSpy: ReturnType<typeof vi.spyOn> | undefined;

    beforeEach(async () => {
        origGetContext = typeof HTMLCanvasElement !== "undefined" ? HTMLCanvasElement.prototype.getContext : undefined;
        if (typeof HTMLCanvasElement !== "undefined") {
            HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
                arc: vi.fn(),
                beginPath: vi.fn(),
                clearRect: vi.fn(),
                clip: vi.fn(),
                closePath: vi.fn(),
                fill: vi.fn(),
                fillRect: vi.fn(),
                fillText: vi.fn(),
                lineTo: vi.fn(),
                measureText: vi.fn().mockReturnValue({ width: 0 }),
                moveTo: vi.fn(),
                rect: vi.fn(),
                restore: vi.fn(),
                save: vi.fn(),
                setLineDash: vi.fn(),
                setTransform: vi.fn(),
                stroke: vi.fn(),
                strokeRect: vi.fn()
            } as unknown as CanvasRenderingContext2D);
        }

        globalRenderSpy = vi.spyOn(CanvasChartRenderer, "render").mockImplementation(() => {});

        TestBed.configureTestingModule({
            imports: [
                VerticalPercentStackHostComponent,
                HorizontalPercentStackHostComponent,
                NegativePercentStackHostComponent
            ]
        });
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        globalRenderSpy?.mockRestore();
        if (origGetContext) {
            HTMLCanvasElement.prototype.getContext = origGetContext;
        }
    });

    it("formats vertical percent stack crosshair and reference line in percentage points (Section 46)", async () => {
        const fixture = TestBed.createComponent(VerticalPercentStackHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const scene = chart.scene();
        expect(scene).toBeDefined();

        // Hit target 0 is Series 1 at Cat A (30% of total)
        const hit0 = scene?.hitTargets[0];
        expect(hit0).toBeDefined();

        const targetPt = hit0!.point ?? {
            x: hit0!.bounds!.x + hit0!.bounds!.width / 2,
            y: hit0!.bounds!.y + hit0!.bounds!.height / 2
        };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: targetPt.x,
                clientY: targetPt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const overlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(overlay?.crosshair).toBeTruthy();
        // Crosshair Y badge format is percentage point string ending in %
        expect(overlay?.crosshair?.y?.formattedValue).toContain("%");
        expect(overlay?.crosshair?.y?.value).toBe(30);
        expect(overlay?.crosshair?.y?.formattedValue).toBe("30%");

        // Reference line on 50% value axis is formatted in percentage points
        const refLine = overlay?.cartesianOverlay?.referenceLines[0];
        expect(refLine).toBeDefined();
        expect(refLine?.formattedValue).toBe("50%");
    });

    it("formats horizontal percent stack crosshair and reference line in percentage points (Section 47)", async () => {
        const fixture = TestBed.createComponent(HorizontalPercentStackHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const scene = chart.scene();
        expect(scene).toBeDefined();

        // Hit target 0 is Series 1 at Cat A (40% of horizontal total)
        const hit0 = scene?.hitTargets[0];
        expect(hit0).toBeDefined();

        const targetPt = hit0!.point ?? {
            x: hit0!.bounds!.x + hit0!.bounds!.width / 2,
            y: hit0!.bounds!.y + hit0!.bounds!.height / 2
        };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: targetPt.x,
                clientY: targetPt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const overlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(overlay?.crosshair).toBeTruthy();
        // Horizontal: X is the value axis, Y is category
        expect(overlay?.crosshair?.x?.formattedValue).toContain("%");
        expect(overlay?.crosshair?.x?.value).toBe(40);
        expect(overlay?.crosshair?.x?.formattedValue).toBe("40%");

        // Reference line at X=75%
        const refLine = overlay?.cartesianOverlay?.referenceLines[0];
        expect(refLine).toBeDefined();
        expect(refLine?.formattedValue).toBe("75%");
    });

    it("formats negative percent stack crosshair preserving signed percentage points (Section 48)", async () => {
        const fixture = TestBed.createComponent(NegativePercentStackHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const scene = chart.scene();
        expect(scene).toBeDefined();

        // Find positive bar and negative bar for Cat A
        const bars: readonly SceneHitTarget[] = scene?.hitTargets ?? [];
        const posBar = bars.find(b => (b.value ?? b.yValue) === 60);
        const negBar = bars.find(b => (b.value ?? b.yValue) === -40);
        expect(posBar).toBeDefined();
        expect(negBar).toBeDefined();

        // Test pointer over negative bar
        const negPt = negBar!.point ?? {
            x: negBar!.bounds!.x + negBar!.bounds!.width / 2,
            y: negBar!.bounds!.y + negBar!.bounds!.height / 2
        };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: negPt.x,
                clientY: negPt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const negOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(negOverlay?.crosshair).toBeTruthy();
        expect(negOverlay?.crosshair?.y?.value).toBe(-100);
        expect(negOverlay?.crosshair?.y?.formattedValue).toBe("-100%");

        // Test pointer over positive bar
        const posPt = posBar!.point ?? {
            x: posBar!.bounds!.x + posBar!.bounds!.width / 2,
            y: posBar!.bounds!.y + posBar!.bounds!.height / 2
        };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: posPt.x,
                clientY: posPt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const posOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(posOverlay?.crosshair).toBeTruthy();
        expect(posOverlay?.crosshair?.y?.value).toBe(100);
        expect(posOverlay?.crosshair?.y?.formattedValue).toBe("100%");
    });
});
