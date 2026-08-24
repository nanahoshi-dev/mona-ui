import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../../models/chart-crosshair.models";
import type { ChartRenderOverlayState } from "../../internal/render/cartesian-chart-renderer";

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
            <mona-line-series [data]="data()" xField="x" field="y" yAxisId="y-main" name="Line 1" />
            <mona-line-series [data]="data2()" xField="x" field="y" yAxisId="y-main" name="Line 2" />

            @if (showCrosshair()) {
                <mona-chart-crosshair
                    [enabled]="crosshairEnabled()"
                    [mode]="crosshairMode()"
                    [snap]="crosshairSnap()"
                    [xAxisId]="crosshairXAxisId()"
                    [yAxisId]="crosshairYAxisId()" />
            }

            @if (showTooltip()) {
                <mona-chart-tooltip
                    [enabled]="tooltipEnabled()"
                    [shared]="tooltipShared()" />
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
    public readonly data2 = signal([
        { x: 0, y: 20 },
        { x: 50, y: 70 },
        { x: 100, y: 80 }
    ]);
    public readonly showCrosshair = signal(true);
    public readonly showTooltip = signal(false);
    public readonly tooltipEnabled = signal(true);
    public readonly tooltipShared = signal(false);
    public readonly crosshairEnabled = signal(true);
    public readonly crosshairMode = signal<ChartCrosshairMode>("xy");
    public readonly crosshairSnap = signal<ChartCrosshairSnapMode>("nearest");
    public readonly crosshairXAxisId = signal<string | undefined>(undefined);
    public readonly crosshairYAxisId = signal<string | undefined>(undefined);
}

describe("ChartCrosshairOwnerLifecycle", () => {
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
            imports: [LifecycleHostComponent]
        });
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        globalRenderSpy?.mockRestore();
        if (origGetContext) {
            HTMLCanvasElement.prototype.getContext = origGetContext;
        }
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

        // Crosshair and crosshair-owned highlight exist in overlay state
        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).toBeNull();

        // Now remove crosshair with @if
        fixture.componentInstance.showCrosshair.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        const postRemoveOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postRemoveOverlay?.crosshair ?? null).toBeNull();
        expect(postRemoveOverlay?.interaction ?? null).toBeNull();
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
        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();

        // Unmount crosshair
        fixture.componentInstance.showCrosshair.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        // Crosshair is gone, but tooltip highlight and DOM remain!
        const postRemoveOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postRemoveOverlay?.crosshair ?? null).toBeNull();
        expect(postRemoveOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();
    });

    it("clears tooltip-owned highlight when tooltip is unmounted without crosshair (Gate B / tooltip unmount)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
        fixture.componentInstance.showCrosshair.set(false);
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();

        // Unmount tooltip
        fixture.componentInstance.showTooltip.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        const postRemoveOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postRemoveOverlay?.interaction ?? null).toBeNull();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).toBeNull();
    });

    it("transfers ownership to crosshair when tooltip is unmounted with nearest crosshair present (Gate B / takeover)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();

        // Unmount tooltip
        fixture.componentInstance.showTooltip.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        // Tooltip DOM is gone, but crosshair and crosshair-owned highlight remain active!
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).toBeNull();
        const postRemoveOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postRemoveOverlay?.crosshair).toBeTruthy();
        expect(postRemoveOverlay?.interaction?.activeHitTarget).toBeTruthy();
    });

    it("coalesces tooltip-unregister to crosshair takeover into a single repaint", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
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

        globalRenderSpy?.mockClear();

        // Unmount tooltip
        fixture.componentInstance.showTooltip.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        // Ownership takeover must repaint exactly once, not intermediate unpaint + repaint
        expect(globalRenderSpy).toHaveBeenCalledTimes(1);
    });

    it("retires tooltip-owned state when tooltip is dynamically disabled (Gate B / dynamic tooltip)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
        fixture.componentInstance.showCrosshair.set(false);
        fixture.componentInstance.tooltipEnabled.set(true);
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();

        // Dynamically disable tooltip
        fixture.componentInstance.tooltipEnabled.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        const postDisableOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postDisableOverlay?.interaction ?? null).toBeNull();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).toBeNull();
    });

    it("reconciles retained pointer when tooltip is dynamically re-enabled (Gate B / dynamic tooltip enable)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
        fixture.componentInstance.showCrosshair.set(true);
        fixture.componentInstance.tooltipEnabled.set(false);
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).toBeNull();

        // Dynamically enable tooltip
        fixture.componentInstance.tooltipEnabled.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const postEnableOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postEnableOverlay?.interaction?.activeHitTarget).toBeTruthy();
        expect(fixture.debugElement.query(By.css("div[data-placement]"))).not.toBeNull();
    });

    it("re-resolves semantic points on tooltip shared toggle false -> true and true -> false (Gate B / shared)", async () => {
        const fixture = TestBed.createComponent(LifecycleHostComponent);
        fixture.componentInstance.showTooltip.set(true);
        fixture.componentInstance.showCrosshair.set(false);
        fixture.componentInstance.tooltipShared.set(false);
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

        // Non-shared tooltip has 1 point hit
        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.interaction?.activeHits.length).toBe(1);

        // Toggle shared to true without moving pointer
        fixture.componentInstance.tooltipShared.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        // Shared tooltip now includes both series at x=50
        const sharedOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(sharedOverlay?.interaction?.activeHits.length).toBe(2);

        // Toggle shared back to false
        fixture.componentInstance.tooltipShared.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        const nonSharedOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(nonSharedOverlay?.interaction?.activeHits.length).toBe(1);
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();

        // Dynamically disable crosshair
        fixture.componentInstance.crosshairEnabled.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        const postDisableOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postDisableOverlay?.crosshair ?? null).toBeNull();
        expect(postDisableOverlay?.interaction ?? null).toBeNull();
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();
        expect(lastOverlay?.interaction?.activeHitTarget).toBeTruthy();

        // Change snap to pointer
        fixture.componentInstance.crosshairSnap.set("pointer");
        fixture.detectChanges();
        await fixture.whenStable();

        // Crosshair state remains (in pointer mode), but mark highlight is cleared
        const postSnapOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postSnapOverlay?.crosshair).toBeTruthy();
        expect(postSnapOverlay?.interaction ?? null).toBeNull();
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

        const lastOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(lastOverlay?.crosshair).toBeTruthy();

        // Change target to y-sec (which has no series bound)
        fixture.componentInstance.crosshairYAxisId.set("y-sec");
        fixture.detectChanges();
        await fixture.whenStable();

        const postChangeOverlay = globalRenderSpy?.mock.lastCall?.[2] as ChartRenderOverlayState | undefined;
        expect(postChangeOverlay?.crosshair ?? null).toBeNull();
        expect(postChangeOverlay?.interaction ?? null).toBeNull();
    });

    it("guarantees no test diagnostic getters are exposed on the ChartComponent public API", () => {
        type Forbidden =
            | "interactionOwner"
            | "interactionState"
            | "currentCrosshairState"
            | "currentTooltipPosition"
            | "currentTooltipContext";

        type Leaked = Extract<keyof ChartComponent, Forbidden>;
        const _leakCheck: Leaked extends never ? true : false = true;
        expect(_leakCheck).toBe(true);

        const forbiddenProps: Forbidden[] = [
            "interactionOwner",
            "interactionState",
            "currentCrosshairState",
            "currentTooltipPosition",
            "currentTooltipContext"
        ];

        for (const prop of forbiddenProps) {
            expect(prop in ChartComponent.prototype).toBe(false);
        }
    });
});
