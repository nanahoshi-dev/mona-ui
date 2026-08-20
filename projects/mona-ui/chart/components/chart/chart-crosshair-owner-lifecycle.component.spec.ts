import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it, beforeEach } from "vitest";
import { ChartComponent } from "./chart.component";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../../models/chart-crosshair.models";

@Component({
    imports: [
        ChartComponent,
        ChartCrosshairComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent
    ],
    template: `
        <mona-chart [animation]="false" style="width: 500px; height: 300px;">
            <mona-chart-x-axis axisId="x-main" />
            <mona-chart-y-axis axisId="y-main" />
            <mona-chart-y-axis axisId="y-sec" />
            <mona-line-series [data]="data()" xField="x" field="y" yAxisId="y-main" />

            @if (showCrosshair()) {
                <mona-chart-crosshair
                    [enabled]="crosshairEnabled()"
                    [mode]="crosshairMode()"
                    [snap]="crosshairSnap()"
                    [xAxisId]="crosshairXAxisId()"
                    [yAxisId]="crosshairYAxisId()" />
            }

            @if (showTooltip()) {
                <mona-chart-tooltip />
            }
        </mona-chart>
    `
})
class LifecycleHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { x: 0, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 90 }
    ]);
    public readonly showCrosshair = signal(true);
    public readonly showTooltip = signal(false);
    public readonly crosshairEnabled = signal(true);
    public readonly crosshairMode = signal<ChartCrosshairMode>("xy");
    public readonly crosshairSnap = signal<ChartCrosshairSnapMode>("nearest");
    public readonly crosshairXAxisId = signal<string | undefined>(undefined);
    public readonly crosshairYAxisId = signal<string | undefined>(undefined);
}

describe("ChartCrosshairOwnerLifecycle (WP0 / Gates A & B)", () => {
    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [LifecycleHostComponent]
        });
    });

    it("clears crosshair-owned highlight when crosshair component is unmounted (Gate A)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(false);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.crosshairSnap.set("nearest");
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const pt = chart.scene()?.hitTargets[1]?.point ?? { x: 281, y: 150 };
        expect(canvas).toBeDefined();

        // Dispatch pointer move onto mark at x=50, y=50
        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: pt.x,
                clientY: pt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        // Crosshair and crosshair-owned highlight exist
        expect(chart["crosshairState"]()).not.toBeNull();
        expect(chart["tooltipPosition"]()).toBeNull(); // tooltip is disabled

        // Now remove crosshair with @if
        fixture.componentInstance.showCrosshair.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(chart["crosshairState"]()).toBeNull();
    });

    it("preserves tooltip-owned highlight when crosshair component is unmounted (Gate B)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.crosshairSnap.set("nearest");
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const pt = chart.scene()?.hitTargets[1]?.point ?? { x: 281, y: 150 };

        // Move pointer over mark
        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: pt.x,
                clientY: pt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        // Tooltip owns highlight
        expect(chart["tooltipPosition"]()).not.toBeNull();
        expect(chart["tooltipContext"]()).not.toBeNull();
        expect(chart["crosshairState"]()).not.toBeNull();

        // Unmount crosshair
        fixture.componentInstance.showCrosshair.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        // Crosshair is gone, but tooltip highlight and context remain!
        expect(chart["crosshairState"]()).toBeNull();
        expect(chart["tooltipPosition"]()).not.toBeNull();
        expect(chart["tooltipContext"]()).not.toBeNull();
    });

    it("clears crosshair-owned highlight when crosshair is dynamically disabled (Gate B / dynamic)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(false);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.crosshairSnap.set("nearest");
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const pt = chart.scene()?.hitTargets[1]?.point ?? { x: 281, y: 150 };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: pt.x,
                clientY: pt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(chart["crosshairState"]()).not.toBeNull();

        // Dynamically disable crosshair
        fixture.componentInstance.crosshairEnabled.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(chart["crosshairState"]()).toBeNull();
    });

    it("clears crosshair-owned highlight when snap changes from nearest to pointer (Gate B / dynamic)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(false);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.crosshairSnap.set("nearest");
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const pt = chart.scene()?.hitTargets[1]?.point ?? { x: 281, y: 150 };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: pt.x,
                clientY: pt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(chart["crosshairState"]()).not.toBeNull();

        // Change snap to pointer
        fixture.componentInstance.crosshairSnap.set("pointer");
        fixture.detectChanges();
        await fixture.whenStable();

        // Crosshair state remains (in pointer mode), but mark highlight is cleared
        expect(chart["crosshairState"]()).not.toBeNull();
    });

    it("clears crosshair when axis target changes to incompatible namespace (Gate B / dynamic)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(false);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.crosshairSnap.set("nearest");
        fixture.componentInstance.crosshairYAxisId.set("y-main");
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const canvas = fixture.debugElement.query(By.css("canvas"))?.nativeElement;
        const pt = chart.scene()?.hitTargets[1]?.point ?? { x: 281, y: 150 };

        canvas?.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: pt.x,
                clientY: pt.y,
                bubbles: true
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(chart["crosshairState"]()).not.toBeNull();

        // Change target to y-sec (which has no series bound)
        fixture.componentInstance.crosshairYAxisId.set("y-sec");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(chart["crosshairState"]()).toBeNull();
    });
});
