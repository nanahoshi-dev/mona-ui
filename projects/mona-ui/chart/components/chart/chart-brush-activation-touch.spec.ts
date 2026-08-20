import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import type { ChartBrushActivation, ChartBrushChangeEvent } from "../../models/chart-brush.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartBrushComponent
    ],
    template: `
        <mona-chart [animation]="false" [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-brush
                [activation]="activation()"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class BrushActivationHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public readonly activation = signal<ChartBrushActivation>("shift-drag");
    public brushEvents: ChartBrushChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }
}

describe("Chart Brush Activation Modifier & Touch Rejection", () => {
    let fixture: ComponentFixture<BrushActivationHostComponent>;
    let host: BrushActivationHostComponent;

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

        await TestBed.configureTestingModule({
            imports: [BrushActivationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BrushActivationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("rejects touch pointers for brush activation", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        expect(chartEl).toBeDefined();

        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "touch",
                shiftKey: true,
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 150,
                clientY: 150,
                pointerType: "touch",
                shiftKey: true,
                bubbles: true
            })
        );
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(0);
    });

    it("requires shift key when activation is shift-drag", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        host.activation.set("shift-drag");
        fixture.detectChanges();
        await fixture.whenStable();

        // Drag without shift
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                shiftKey: false,
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 150,
                clientY: 150,
                pointerType: "mouse",
                shiftKey: false,
                bubbles: true
            })
        );
        fixture.detectChanges();

        expect(host.brushEvents.length).toBe(0);

        // Drag with shift
        chartEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 50,
                clientY: 50,
                pointerType: "mouse",
                shiftKey: true,
                bubbles: true
            })
        );
        fixture.detectChanges();

        chartEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 150,
                clientY: 150,
                pointerType: "mouse",
                shiftKey: true,
                bubbles: true
            })
        );
        fixture.detectChanges();

        expect(host.brushEvents.length).toBeGreaterThan(0);
    });
});
