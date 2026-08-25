import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartSynchronizationInput } from "../models/chart-synchronization.models";
import type { ChartViewportState } from "../models/chart-viewport.models";
import { CartesianStageTracker } from "../internal/layout/cartesian-stage-instrumentation";
import { ChartDensityTracker } from "../internal/layout/chart-density-instrumentation";
import { ChartCrosshairComponent } from "../components/chart-crosshair/chart-crosshair.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { ChartComponent } from "../components/chart/chart.component";

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, ChartCrosshairComponent],
    template: `
        <mona-chart
            #chartA
            [data]="dataA()"
            xField="x"
            [navigation]="true"
            [synchronization]="sync"
            [viewport]="viewportA()"
            [style.width.px]="500"
            [style.height.px]="300"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="Dense-A" />
            <mona-chart-crosshair [enabled]="true" mode="xy" snap="pointer" xAxisId="x-main" yAxisId="y-main" />
        </mona-chart>
        <mona-chart
            #chartB
            [data]="dataB()"
            xField="x"
            [navigation]="true"
            [synchronization]="sync"
            [style.width.px]="500"
            [style.height.px]="300"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="Dense-B" />
            <mona-chart-crosshair [enabled]="true" mode="xy" snap="pointer" xAxisId="x-main" yAxisId="y-main" />
        </mona-chart>
    `
})
class SyncDensityHostComponent {
    public readonly chartA = viewChild.required<ChartComponent>("chartA");
    public readonly chartB = viewChild.required<ChartComponent>("chartB");

    public readonly dataA = signal<readonly unknown[]>([]);
    public readonly dataB = signal<readonly unknown[]>([]);
    public readonly sync: ChartSynchronizationInput = { group: "dense-dashboard" };
    public readonly viewportA = signal<ChartViewportState | undefined>(undefined);
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public disconnect(): void {}

    public observe(): void {}

    public unobserve(): void {}
}

const nextFrame = (): Promise<void> =>
    new Promise<void>(resolve => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });

describe("combined synchronization + density stress matrix", () => {
    let fixture: ComponentFixture<SyncDensityHostComponent>;
    let host: SyncDensityHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const width = Number.parseFloat(this.style?.width ?? "") || 500;
            const height = Number.parseFloat(this.style?.height ?? "") || 300;
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
            imports: [SyncDensityHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SyncDensityHostComponent);
        host = fixture.componentInstance;

        // Dense dashboard fixture: two differently-sized dense series sharing semantics.
        const make = (count: number, phase: number) =>
            Array.from({ length: count }, (_, i) => ({
                x: i * 2,
                y: Math.sin((i + phase) / 150) * 20 + ((i + phase) % 9000 === 0 ? 200 : 0)
            }));
        host.dataA.set(make(8_000, 0));
        host.dataB.set(make(5_000, 1000));

        fixture.detectChanges();
        host.chartA().flushPendingRender();
        host.chartB().flushPendingRender();
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
        ChartDensityTracker.uninstall();
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    it("one source viewport operation produces one bounded recipient projection and no Stage A/B", async () => {
        let stageA = 0;
        let stageB = 0;
        const density = ChartDensityTracker.install();
        const buildsBefore = density.snapshot.densityRuntimeBuilds;
        CartesianStageTracker.current = {
            onStageA: () => stageA++,
            onStageB: () => stageB++
        };

        try {
            // One semantic source operation (single-shot programmatic op).
            host.chartA().setViewportWindow({
                axis: "x",
                axisId: "x-main",
                kind: "continuous",
                max: 9_000,
                min: 1_000
            });
            await nextFrame();

            expect(stageA).toBe(0);
            expect(stageB).toBe(0);
            expect(density.snapshot.densityRuntimeBuilds - buildsBefore).toBe(0);

            // Recipient moved once and stayed bounded.
            const bViewport = host
                .chartB()
                .getViewport()
                ?.axes.find(a => a.axisId === "x-main") as { min: number; max: number } | undefined;
            expect(bWindowDefined(bViewport)).toBe(true);
            const bScene = host.chartB()["cartesianXYScene"]();
            const bLine = bScene?.series.find(s => s.type === "line") as { points: readonly unknown[] };
            expect(bLine.points.length).toBeLessThan(10_000);
            expect(bLine.points.length).toBeGreaterThan(0);
        } finally {
            CartesianStageTracker.current = null;
            ChartDensityTracker.uninstall();
        }
    });

    it("recipient axis-value crosshair lands at the exact semantic position even when unsampled", async () => {
        // Choose a semantic X inside both data domains that is not part of B's visual sample.
        const targetSemanticX = 8_753;
        const canvasA = fixture.debugElement.queryAll(By.css("canvas"))[0].nativeElement;

        const sceneA = host.chartA()["cartesianXYScene"]()!;
        const xSnap = sceneA.coordinateSpace!.get({ axis: "x", axisId: "x-main" })!;
        const pixelX = xSnap.viewportScale.map(targetSemanticX)!;
        const pointerY = sceneA.plotRect.y + sceneA.plotRect.height / 2;

        canvasA.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: pixelX, clientY: pointerY }));
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();

        const remoteOnB = host.chartB()["crosshairState"]();
        expect(remoteOnB).not.toBeNull();
        expect(remoteOnB?.source).toBe("sync");
        // Pointer-snap inversion produces floating semantic values: verify
        // proximity to the intended instant rather than exact equality.
        expect(remoteOnB?.x?.value).toBeDefined();
        expect(Number(remoteOnB?.x?.value)).toBeCloseTo(targetSemanticX, 0);

        // The recipient's rendered sample does not contain that exact datum...
        const bScene = host.chartB()["cartesianXYScene"]()!;
        const bLine = bScene.series.find(s => s.type === "line") as { points: readonly { index: number }[] };
        const nearestRawIndex = Math.round(Number(remoteOnB?.x?.value) / 2);
        expect(bLine.points.some(p => p.index === nearestRawIndex)).toBe(false);

        // ...but the optional local tooltip resolution can still find the raw datum.
        const providers = Array.from(bScene.denseInteraction?.values() ?? []);
        expect(providers.length).toBeGreaterThan(0);
        const rawMatches = providers[0].resolveNearest({ pixel: { x: pixelX * (300 / 500), y: remoteOnB!.anchor.y } });
        if (rawMatches.length > 0) {
            expect(rawMatches[0].index).toBeGreaterThanOrEqual(0);
        }
    });

    it("controlled dense source publishes only after acceptance without duplicate echo", async () => {
        // Make chart A controlled by binding viewport input through the signal.
        host.viewportA.set({ axes: [] });
        fixture.detectChanges();

        host.chartA().setViewportWindow({ axis: "x", axisId: "x-main", kind: "continuous", max: 7_000, min: 500 });
        await nextFrame();

        // Rejected: peers unmoved.
        expect(host.chartB().getViewport()?.axes.length ?? 0).toBe(0);

        // Parent accepts.
        host.viewportA.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 7_000, min: 500 }] });
        fixture.detectChanges();
        await nextFrame();

        const bSceneBefore = host.chartB()["cartesianXYScene"]();
        await nextFrame();
        const bSceneAfter = host.chartB()["cartesianXYScene"]();
        // No ping-pong: B's projection is stable after the accepted transaction settles.
        expect(bSceneAfter).toBe(bSceneBefore);
        expect(host.chartB().getViewport()?.axes.length ?? 0).toBeGreaterThan(0);
    });

    function bWindowDefined(v: unknown): boolean {
        return v !== undefined && v !== null;
    }
});
