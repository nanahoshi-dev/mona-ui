import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartPointEvent } from "../../models/chart-event.models";
import { ChartComponent } from "./chart.component";
import { HeatmapSeriesComponent } from "../heatmap-series/heatmap-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";

@Component({
    imports: [ChartComponent, HeatmapSeriesComponent],
    template: `
        <mona-chart
            [data]="data()"
            xField="day"
            (pointClick)="onPointClick($event)"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-heatmap-series field="val" yField="hour" name="Activity" />
        </mona-chart>
    `
})
class HeatmapTestHostComponent {
    public readonly data = signal([{ day: "Mon", hour: "10am", val: 42 }]);
    public readonly clickedEvents: ChartPointEvent[] = [];

    public onPointClick(event: ChartPointEvent): void {
        this.clickedEvents.push(event);
    }
}

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart [data]="data()" xField="x" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-line-series field="y" name="Trend" />
        </mona-chart>
    `
})
class CoalescingTestHostComponent {
    public readonly data = signal([
        { x: 1, y: 10 },
        { x: 2, y: 20 }
    ]);
}

describe("Chart Stage 0 Stability Closure", () => {
    describe("Pointer and Keyboard Click Payload Parity", () => {
        let fixture: ComponentFixture<HeatmapTestHostComponent>;
        let host: HeatmapTestHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HeatmapTestHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HeatmapTestHostComponent);
            host = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should emit identical semantic payloads for pointer click, Enter, and Space", async () => {
            const chartDebug = fixture.debugElement.query(By.directive(ChartComponent));
            const chartComp = chartDebug.componentInstance as ChartComponent;
            chartComp.recomputeScene();
            fixture.detectChanges();

            const canvas = chartDebug.query(By.css("canvas")).nativeElement as HTMLCanvasElement;
            const container = chartDebug.nativeElement as HTMLElement;

            const scene = chartComp.scene();
            expect(scene).toBeDefined();
            const hitTarget = scene?.hitTargets[0];
            expect(hitTarget).toBeDefined();

            // 1. Pointer click on canvas
            const rect = canvas.getBoundingClientRect();
            const clickX = hitTarget!.bounds!.x + hitTarget!.bounds!.width / 2;
            const clickY = hitTarget!.bounds!.y + hitTarget!.bounds!.height / 2;

            canvas.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    clientX: rect.left + clickX,
                    clientY: rect.top + clickY
                })
            );
            fixture.detectChanges();

            expect(host.clickedEvents.length).toBe(1);
            const pointerPayload = host.clickedEvents[0];

            // 2. Keyboard Enter
            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
            fixture.detectChanges();
            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
            fixture.detectChanges();

            expect(host.clickedEvents.length).toBe(2);
            const enterPayload = host.clickedEvents[1];

            // 3. Keyboard Space
            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
            fixture.detectChanges();

            expect(host.clickedEvents.length).toBe(3);
            const spacePayload = host.clickedEvents[2];

            // Verify parity across all three
            expect(pointerPayload).toEqual(enterPayload);
            expect(pointerPayload).toEqual(spacePayload);

            // Verify Heatmap-specific fields are present in pointer payload
            expect(pointerPayload.formattedXValue).toBe("Mon");
            expect(pointerPayload.formattedYCategory).toBe("10am");
            expect(pointerPayload.yCategory).toBe("10am");
            expect(pointerPayload.datum).toEqual({ day: "Mon", hour: "10am", val: 42 });
        });
    });

    describe("Registration Coalescing", () => {
        it("should render cleanly when multiple child components register", async () => {
            const spy = vi.spyOn(ChartLayoutEngine, "computeScene");
            try {
                const fixture = TestBed.createComponent(CoalescingTestHostComponent);
                fixture.detectChanges();

                const chartDebug = fixture.debugElement.query(By.directive(ChartComponent));
                const chartComp = chartDebug.componentInstance as ChartComponent;

                const scene = chartComp.scene();
                expect(scene).toBeDefined();
                if (scene && scene.coordinateSystem === "cartesian") {
                    expect(scene.series.length).toBe(1);
                    expect(scene.axes.length).toBe(2);
                }
                // Initial constructor pass (no children) + 1 coalesced pass (after children registered) = at most 2 calls
                expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
            } finally {
                spy.mockRestore();
            }
        });
    });
});
