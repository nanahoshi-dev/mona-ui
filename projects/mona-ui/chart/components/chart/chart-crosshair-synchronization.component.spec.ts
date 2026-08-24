import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartSynchronizationInput } from "../../models/chart-synchronization.models";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartComponent } from "./chart.component";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import type { ChartRenderOverlayState } from "../../internal/render/cartesian-chart-renderer";

interface DataItem {
    readonly x: number;
    readonly y: number;
}

const DATA: DataItem[] = Array.from({ length: 25 }, (_, i) => ({ x: i * 4, y: i * 2 }));

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, ChartCrosshairComponent],
    template: `
        <mona-chart
            #chartA
            [data]="data()"
            xField="x"
            [navigation]="true"
            [synchronization]="syncA()"
            [style.width.px]="400"
            [style.height.px]="300"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="A" />
            @if (crosshairA()) {
                <mona-chart-crosshair [enabled]="true" mode="xy" snap="pointer" xAxisId="x-main" yAxisId="y-main" />
            }
        </mona-chart>
        <mona-chart
            #chartB
            [data]="data()"
            xField="x"
            [navigation]="true"
            [synchronization]="syncB()"
            [style.width.px]="300"
            [style.height.px]="200"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="B" />
            @if (crosshairB()) {
                <mona-chart-crosshair [enabled]="true" mode="xy" snap="pointer" xAxisId="x-main" yAxisId="y-main" />
            }
        </mona-chart>
    `
})
class CrosshairSyncHostComponent {
    public readonly chartA = viewChild.required<ChartComponent>("chartA");
    public readonly chartB = viewChild.required<ChartComponent>("chartB");
    public readonly crosshairA = signal(true);
    public readonly crosshairB = signal(true);
    public readonly data = signal<readonly unknown[]>(DATA);
    public readonly syncA = signal<ChartSynchronizationInput>({ group: "g1" });
    public readonly syncB = signal<ChartSynchronizationInput>({ group: "g1" });
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public disconnect(): void {}

    public observe(): void {}

    public unobserve(): void {}
}

const settleFrames = async (): Promise<void> => {
    await nextFrame();
    await nextFrame();
};

const nextFrame = (): Promise<void> =>
    new Promise<void>(resolve => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });

describe("synchronized crosshair", () => {
    let fixture: ComponentFixture<CrosshairSyncHostComponent>;
    let host: CrosshairSyncHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;
    let originalGetContext: typeof HTMLCanvasElement.prototype.getContext | undefined;
    let globalRenderSpy: ReturnType<typeof vi.spyOn> | undefined;

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        originalGetContext = HTMLCanvasElement.prototype.getContext;
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
        globalRenderSpy = vi.spyOn(CanvasChartRenderer, "render").mockImplementation(() => {});
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const widthAttr = this.style?.width ? Number.parseFloat(this.style.width) : NaN;
            const heightAttr = this.style?.height ? Number.parseFloat(this.style.height) : NaN;
            const width = Number.isFinite(widthAttr) ? widthAttr : 400;
            const height = Number.isFinite(heightAttr) ? heightAttr : 300;
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
        host.chartA().flushPendingRender();
        host.chartB().flushPendingRender();
    });

    afterEach(() => {
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        if (originalGetContext) {
            HTMLCanvasElement.prototype.getContext = originalGetContext;
        }
        globalRenderSpy?.mockRestore();
        vi.restoreAllMocks();
    });

    it("delivers semantic crosshair position from source to recipient", async () => {
        globalRenderSpy?.mockClear();
        const sceneA = host.chartA().scene();
        const target = sceneA?.hitTargets.find(h => h.point) ?? null;

        fixture.debugElement.queryAll(By.css("canvas"))[0].nativeElement.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                clientX: target!.point!.x,
                clientY: target!.point!.y
            })
        );
        await settleFrames();
        fixture.detectChanges();

        const localState = host.chartA()["crosshairState"]();
        expect(localState).not.toBeNull();
        expect(localState?.source).toBe("pointer");

        const remoteState = host.chartB()["crosshairState"]();
        expect(remoteState).not.toBeNull();
        expect(remoteState?.source).toBe("sync");

        // The semantic value must match even though plot sizes differ.
        expect(remoteState?.x?.value).toBe(localState?.x?.value);
        // Coordinates are recipient-local, not forwarded pixels.
        expect(remoteState!.anchor.x).toBeLessThanOrEqual(300 + 1e-6);

        const recipientPaintedSyncCrosshair = globalRenderSpy?.mock.calls.some((call: readonly unknown[]) => {
            const overlay = call[2] as ChartRenderOverlayState | null | undefined;
            return overlay?.crosshair?.source === "sync";
        });
        expect(recipientPaintedSyncCrosshair).toBe(true);
    });

    it("recipient without a crosshair child ignores remote crosshair presentation", async () => {
        host.crosshairB.set(false);
        fixture.detectChanges();
        await settleFrames();

        const sceneA = host.chartA().scene();
        const target = sceneA?.hitTargets.find(h => h.point) ?? null;
        fixture.debugElement.queryAll(By.css("canvas"))[0].nativeElement.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                clientX: target!.point!.x,
                clientY: target!.point!.y
            })
        );
        await settleFrames();
        fixture.detectChanges();

        expect(host.chartA()["crosshairState"]()).not.toBeNull();
        expect(host.chartB()["crosshairState"]()).toBeNull();
    });
});
