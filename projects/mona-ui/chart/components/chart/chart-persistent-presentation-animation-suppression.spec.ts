import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { CanvasChartRenderer, type ChartRenderOverlayState } from "../../internal/render/canvas-chart-renderer";
import type { ChartAnimationInput } from "../../models/chart-animation.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart
            [animation]="animationConfig()"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis [type]="xAxisType()" />
            <mona-chart-y-axis />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="true">
                <ng-template monaChartDataLabel let-ctx>
                    <span class="custom-dom-label">{{ ctx.formattedValue }}</span>
                </ng-template>
            </mona-bar-series>
            <mona-chart-selection
                [mode]="'multiple'"
                [selectedMarkIds]="selectedMarkIds()" />
        </mona-chart>
    `
})
class AnimationOverlayHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public readonly animationConfig = signal<ChartAnimationInput>({ duration: 200, easing: "linear" });
    public readonly xAxisType = signal<import("../../models/chart-axis.models").ChartXAxisType>("category");
    public readonly selectedMarkIds = signal<readonly string[]>(["s0:0"]);
}

describe("Chart Persistent Presentation Animation Suppression", () => {
    let fixture: ComponentFixture<AnimationOverlayHostComponent>;
    let host: AnimationOverlayHostComponent;

    beforeEach(async () => {
        vi.useFakeTimers();

        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => {}
        });
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            arc: vi.fn(),
            beginPath: vi.fn(),
            bezierCurveTo: vi.fn(),
            clearRect: vi.fn(),
            clip: vi.fn(),
            closePath: vi.fn(),
            createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillText: vi.fn(),
            lineTo: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 20 }),
            moveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            setLineDash: vi.fn(),
            setTransform: vi.fn(),
            stroke: vi.fn(),
            strokeRect: vi.fn(),
            strokeText: vi.fn()
        } as any);

        await TestBed.configureTestingModule({
            imports: [AnimationOverlayHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimationOverlayHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("deterministic morph: suppresses Canvas labels, selection visuals, and DOM templates at intermediate frame and restores them upon completion", () => {
        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");

        // Verify pre-animation DOM template exists and is visible (not suppressed)
        const domLabel = fixture.nativeElement.querySelector(".custom-dom-label");
        expect(domLabel).not.toBeNull();
        const domLabelWrapper = domLabel?.parentElement;
        expect(domLabelWrapper).not.toBeNull();
        expect(domLabelWrapper!.classList.contains("opacity-0")).toBe(false);

        // Trigger data morph transition
        host.data.set([
            { name: "A", value: 30 },
            { name: "B", value: 40 }
        ]);
        fixture.detectChanges();

        // 1. Assert animation started and mode is morph
        expect(host.chart().isAnimating()).toBe(true);
        expect(host.chart().animationMode()).toBe("morph");

        // 2. Advance clock to intermediate progress (100ms into 200ms duration)
        vi.advanceTimersByTime(100);
        fixture.detectChanges();

        expect(host.chart().isAnimating()).toBe(true);

        // Assert intermediate suppressed state on the render spy
        expect(renderSpy).toHaveBeenCalled();
        const suppressedCalls = renderSpy.mock.calls.filter(call => {
            const overlay = call[2] as ChartRenderOverlayState | null;
            return overlay?.cartesianDataLabels === null;
        });
        expect(suppressedCalls.length).toBeGreaterThan(0);

        for (const call of suppressedCalls) {
            const overlayState = call[2] as ChartRenderOverlayState;
            expect(overlayState.cartesianDataLabels).toBeNull();
            expect(overlayState.selectionScene).toBeNull();
            expect(overlayState.activeBrushBounds).toBeNull();
        }

        // Authoritative selection state remains durable during visual suppression
        expect(host.selectedMarkIds()).toEqual(["s0:0"]);

        // Custom DOM template labels are visually suppressed (opacity-0 class) - unconditional
        expect(domLabelWrapper!.classList.contains("opacity-0")).toBe(true);

        // 3. Advance clock to completion
        vi.advanceTimersByTime(150);
        fixture.detectChanges();

        expect(host.chart().isAnimating()).toBe(false);

        // Target persistent presentation is restored on the final render call
        const lastCall = renderSpy.mock.calls[renderSpy.mock.calls.length - 1];
        const finalOverlay = lastCall[2] as ChartRenderOverlayState;
        expect(finalOverlay.cartesianDataLabels).not.toBeNull();
        expect(finalOverlay.selectionScene).not.toBeNull();
        expect(host.selectedMarkIds()).toEqual(["s0:0"]);

        // Custom DOM template labels are restored - unconditional
        expect(domLabelWrapper!.classList.contains("opacity-0")).toBe(false);

        renderSpy.mockRestore();
    });

    it("deterministic crossfade: suppresses persistent presentation during crossfade animation and restores upon completion", () => {
        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");
        const crossfadeSpy = vi.spyOn(CanvasChartRenderer, "renderCrossfade");

        // Trigger large dataset data update which plans a crossfade (>2000 complexity cost)
        host.data.set(Array.from({ length: 2100 }, (_, i) => ({ name: `Cat ${i}`, value: (i + 1) * 10 })));
        fixture.detectChanges();

        expect(host.chart().isAnimating()).toBe(true);
        expect(host.chart().animationMode()).toBe("crossfade");

        // Step intermediate frame
        vi.advanceTimersByTime(100);
        fixture.detectChanges();

        expect(host.chart().isAnimating()).toBe(true);

        expect(crossfadeSpy).toHaveBeenCalled();
        for (const call of crossfadeSpy.mock.calls) {
            const overlay = call[4] as ChartRenderOverlayState | undefined;
            expect(overlay?.cartesianDataLabels).toBeUndefined();
            expect(overlay?.selectionScene).toBeUndefined();
            expect(overlay?.activeBrushBounds).toBeUndefined();
        }

        // Advance to completion
        vi.advanceTimersByTime(150);
        fixture.detectChanges();

        expect(host.chart().isAnimating()).toBe(false);

        const lastCall = renderSpy.mock.calls[renderSpy.mock.calls.length - 1];
        const finalOverlay = lastCall[2] as ChartRenderOverlayState;
        expect(finalOverlay.cartesianDataLabels).not.toBeNull();
        expect(finalOverlay.selectionScene).not.toBeNull();

        renderSpy.mockRestore();
        crossfadeSpy.mockRestore();
    });

    it("does not suppress overlays when animation is disabled (duration: 0)", async () => {
        host.animationConfig.set({ duration: 0, easing: "linear" });
        fixture.detectChanges();

        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");

        host.data.set([
            { name: "A", value: 50 },
            { name: "B", value: 60 }
        ]);
        fixture.detectChanges();
        host.chart().flushPendingRender();

        expect(host.chart().isAnimating()).toBe(false);
        expect(renderSpy).toHaveBeenCalled();

        const lastCall = renderSpy.mock.calls[renderSpy.mock.calls.length - 1];
        const overlayState = lastCall[2] as ChartRenderOverlayState;
        expect(overlayState).toBeDefined();
        expect(overlayState.cartesianDataLabels).not.toBeNull();
        expect(overlayState.selectionScene).not.toBeNull();

        renderSpy.mockRestore();
    });
});
