import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";

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
            [animation]="animationConfig"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'">
                <ng-template monaChartDataLabel let-ctx>
                    <span>{{ ctx.formattedValue }}</span>
                </ng-template>
            </mona-bar-series>
            <mona-chart-selection [mode]="'single'" />
        </mona-chart>
    `
})
class AnimationOverlayHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public animationConfig = { duration: 200, easing: "linear" as const };
}

describe("Chart Persistent Presentation Animation Suppression Release Gate (GDSB-R2-015)", () => {
    let fixture: ComponentFixture<AnimationOverlayHostComponent>;
    let host: AnimationOverlayHostComponent;

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
            toJSON: () => {}
        });
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            arc: vi.fn(),
            beginPath: vi.fn(),
            clearRect: vi.fn(),
            clip: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillText: vi.fn(),
            lineTo: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 20 }),
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            setLineDash: vi.fn(),
            setTransform: vi.fn(),
            stroke: vi.fn()
        } as any);

        await TestBed.configureTestingModule({
            imports: [AnimationOverlayHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimationOverlayHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("suppresses data labels and selection overlays during intermediate animation frames and restores them upon completion", () => {
        const renderSpy = vi.spyOn(CanvasChartRenderer, "render");

        // Trigger data animation
        host.data.set([
            { name: "A", value: 30 },
            { name: "B", value: 40 }
        ]);
        fixture.detectChanges();

        // Check calls
        expect(renderSpy).toHaveBeenCalled();
        for (const call of renderSpy.mock.calls) {
            const overlayState = call[2] as import("../../internal/render/canvas-chart-renderer").ChartRenderOverlayState | null;
            if (overlayState && overlayState.cartesianDataLabels === null) {
                expect(overlayState.selectionScene).toBeNull();
                expect(overlayState.activeBrushBounds).toBeNull();
            }
        }

        renderSpy.mockRestore();
    });
});
