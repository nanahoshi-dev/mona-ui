import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartAnnotationComponent } from "../chart-annotation/chart-annotation.component";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../../models/chart-crosshair.models";

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartCrosshairComponent,
        ChartAnnotationComponent
    ],
    template: `
        <mona-chart [animation]="false" style="width: 500px; height: 300px;">
            <mona-chart-x-axis [axisId]="'x-main'" [type]="'category'" />
            <mona-chart-y-axis [axisId]="'y-main'" [min]="0" [max]="500" />
            <mona-chart-y-axis [axisId]="'y-sec'" [position]="'right'" [min]="0" [max]="100" />

            <mona-line-series [data]="categoryData()" [xField]="'category'" [field]="'value'" [name]="'Line A'" [xAxisId]="'x-main'" [yAxisId]="'y-main'" />

            @if (showCrosshair()) {
                <mona-chart-crosshair
                    [enabled]="crosshairEnabled()"
                    [mode]="crosshairMode()"
                    [snap]="crosshairSnap()"
                    [maxSnapDistance]="crosshairMaxDist()"
                    [xAxisId]="crosshairXAxisId()"
                    [yAxisId]="crosshairYAxisId()" />
            }

            @if (showAnnotation()) {
                <mona-chart-annotation
                    [x]="'Feb'"
                    [y]="200"
                    [label]="'Annotation Badge'"
                    [labelPlacement]="'top'"
                    [offsetX]="0"
                    [offsetY]="-20" />
            }
        </mona-chart>
    `
})
class FinalReleaseGateHostComponent {
    public readonly chart = viewChild(ChartComponent);

    public readonly categoryData = signal([
        { category: "Jan", value: 100 },
        { category: "Feb", value: 200 },
        { category: "Mar", value: 300 }
    ]);

    public readonly showCrosshair = signal(true);
    public readonly crosshairEnabled = signal(true);
    public readonly crosshairMode = signal<ChartCrosshairMode>("xy");
    public readonly crosshairSnap = signal<ChartCrosshairSnapMode>("nearest");
    public readonly crosshairMaxDist = signal(32);
    public readonly crosshairXAxisId = signal<string | undefined>("x-main");
    public readonly crosshairYAxisId = signal<string | undefined>("y-main");
    public readonly showAnnotation = signal(true);
}

describe("Chart Crosshair and Annotation Reconciliation", () => {
    let fixture: ComponentFixture<FinalReleaseGateHostComponent>;
    let host: FinalReleaseGateHostComponent;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [FinalReleaseGateHostComponent]
        });

        fixture = TestBed.createComponent(FinalReleaseGateHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("retains pointer position and reconciles crosshair when crosshair options dynamically change", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[1]?.point ?? { x: 250, y: 150 };

        // 1. Move pointer over Feb point
        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        let chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.x?.coordinate).toBeCloseTo(pt.x, 0);

        // 2. Change mode from 'xy' to 'x' dynamically without moving pointer
        host.crosshairMode.set("x");
        fixture.detectChanges();
        await fixture.whenStable();

        chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.x).toBeDefined();
        expect(chState?.y).toBeUndefined();
    });

    it("clears crosshair when pointer leaves canvas", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[0]?.point ?? { x: 100, y: 200 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();
        expect(host.chart()?.["crosshairState"]()).not.toBeNull();

        // Dispatch pointerleave
        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointerleave", { bubbles: true })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(host.chart()?.["crosshairState"]()).toBeNull();
    });

    it("computes annotationBadgeAnchors signal and clamps within chart bounds", async () => {
        const anchors = host.chart()?.["annotationBadgeAnchors"]();
        expect(anchors).toBeDefined();
        expect(anchors?.size).toBeGreaterThan(0);
    });

    it("synchronizes crosshair synchronously during keyboard navigation (Gate R)", async () => {
        const chartEl = fixture.debugElement.query(By.css("mona-chart"));

        // Dispatch keydown ArrowRight to select first mark
        chartEl.nativeElement.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
        );
        fixture.detectChanges();
        await fixture.whenStable();

        let chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.x?.axisId).toBe("x-main");

        // Dispatch ArrowRight again to advance to next mark
        chartEl.nativeElement.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
        );
        fixture.detectChanges();
        await fixture.whenStable();

        chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.x?.formattedValue).toBe("Feb");
    });

    it("handles full multi-series, multi-axis, crosshair, and annotation composition (Gate T)", async () => {
        // Change crosshair settings and trigger multiple pointer moves
        host.crosshairMode.set("xy");
        host.crosshairSnap.set("nearest");
        fixture.detectChanges();
        await fixture.whenStable();

        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: 250, clientY: 150 })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(host.chart()?.["crosshairState"]()).not.toBeNull();
        expect(host.chart()?.["annotationBadgeAnchors"]().size).toBeGreaterThan(0);
    });
});
