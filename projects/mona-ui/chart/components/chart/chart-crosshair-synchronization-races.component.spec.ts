import { Component, signal ,viewChildren } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {} from "../../models/chart-synchronization.models";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartComponent } from "./chart.component";

interface DataItem {
    readonly x: number;
    readonly y: number;
}

const DATA: DataItem[] = Array.from({ length: 25 }, (_, i) => ({ x: i * 4, y: i * 2 }));

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, ChartCrosshairComponent],
    template: `
        @for (chartId of chartIds; track chartId) {
            <mona-chart
                #chart
                [data]="data()"
                xField="x"
                [navigation]="true"
                [synchronization]="{ group: 'g1' }"
                [attr.data-chart]="chartId"
                [style.width.px]="300"
                [style.height.px]="220"
                style="display: block;"
            >
                <mona-chart-x-axis axisId="x-main" type="linear" />
                <mona-chart-y-axis axisId="y-main" type="linear" />
                <mona-line-series field="y" name="S" />
                <mona-chart-crosshair [enabled]="true" mode="xy" snap="pointer" xAxisId="x-main" yAxisId="y-main" />
            </mona-chart>
        }
    `
})
class CrosshairSyncHostComponent {
    public readonly chartRefs = viewChildren(ChartComponent);
    public readonly data = signal<readonly unknown[]>(DATA);
    public readonly chartIds = ["a", "b", "c"] as const;

    public chartAt(index: number): ChartComponent {
        return this.chartRefs()[index];
    }
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public observe(): void {}

    public unobserve(): void {}

    public disconnect(): void {}
}

const nextFrame = (): Promise<void> =>
    new Promise<void>(resolve => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });

describe("synchronized crosshair races and priorities", () => {
    let fixture: ComponentFixture<CrosshairSyncHostComponent>;
    let host: CrosshairSyncHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

    const canvases = (): HTMLElement[] =>
        fixture.debugElement.queryAll(By.css("canvas")).map(d => d.nativeElement);

    const move = (canvas: HTMLElement, x: number, y: number): void => {
        canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y }));
    };

    const leave = (canvas: HTMLElement): void => {
        canvas.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    };

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const widthAttr = this.style?.width ? Number.parseFloat(this.style.width) : NaN;
            const heightAttr = this.style?.height ? Number.parseFloat(this.style.height) : NaN;
            const width = Number.isFinite(widthAttr) ? widthAttr : 300;
            const height = Number.isFinite(heightAttr) ? heightAttr : 220;
            return {
                bottom: height,
                height,
                left: 0,
                right: width,
                top: 0,
                width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect;
        });

        await TestBed.configureTestingModule({
            imports: [CrosshairSyncHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CrosshairSyncHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        for (let i = 0; i < 3; i++) {
            host.chartAt(i).flushPendingRender();
        }
    });

    afterEach(() => {
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    const pointOf = (index: number): { x: number; y: number } => {
        const scene = host.chartAt(index).scene()!;
        return scene.hitTargets.find(h => h.point)?.point ?? { x: 100, y: 100 };
    };

    it("delivers semantic crosshair position to all peers", async () => {
        const p = pointOf(0);
        move(canvases()[0], p.x, p.y);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        expect(host.chartAt(1)["crosshairState"]()?.source).toBe("sync");
        expect(host.chartAt(2)["crosshairState"]()?.source).toBe("sync");
        expect(host.chartAt(1)["crosshairState"]()?.x?.value).toBe(host.chartAt(0)["crosshairState"]()?.x?.value);
    });

    it("stale clear from an older origin does not erase a newer origin's state on the recipient", async () => {
        const [canvasA, canvasB] = canvases();

        move(canvasA, pointOf(0).x, pointOf(0).y);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();
        expect(host.chartAt(2)["crosshairState"]()).not.toBeNull();

        // B becomes the newest active origin.
        move(canvasB, pointOf(1).x, pointOf(1).y);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        // A leaves late; its clear is stale relative to B's newer ownership.
        leave(canvasA);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        const stateAfterStaleClear = host.chartAt(2)["crosshairState"]();
        expect(stateAfterStaleClear).not.toBeNull();
        expect(stateAfterStaleClear?.source).toBe("sync");

        // B leaving clears the last active origin.
        leave(canvasB);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();
        expect(host.chartAt(2)["crosshairState"]()).toBeNull();
    });

    it("local pointer interaction outranks remote presentation and restores remote after leave", async () => {
        const [canvasA, canvasB] = canvases();

        move(canvasA, pointOf(0).x, pointOf(0).y);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        const remoteOnB = host.chartAt(1)["crosshairState"]();
        expect(remoteOnB?.source).toBe("sync");

        // Local pointer enters B: local wins.
        move(canvasB, pointOf(1).x, pointOf(1).y);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        const localOnB = host.chartAt(1)["crosshairState"]();
        expect(localOnB).not.toBeNull();
        expect(localOnB?.source).toBe("pointer");

        // Local leave restores A's still-active remote presentation.
        leave(canvasB);
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        const restoredOnB = host.chartAt(1)["crosshairState"]();
        expect(restoredOnB?.source).toBe("sync");
    });
});
