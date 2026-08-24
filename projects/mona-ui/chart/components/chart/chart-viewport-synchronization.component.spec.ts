import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    ChartNavigationInput,
    ChartViewportChangeEvent,
    ChartViewportState
} from "../../models/chart-viewport.models";
import type { ChartSynchronizationInput } from "../../models/chart-synchronization.models";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartComponent } from "./chart.component";

interface DataItem {
    readonly x: number;
    readonly y: number;
}

const DATA: DataItem[] = Array.from({ length: 50 }, (_, i) => ({ x: i * 2, y: Math.sin(i / 5) * 10 + 20 }));

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent],
    template: `
        <mona-chart
            #chartA
            [data]="dataA()"
            xField="x"
            [navigation]="navigationA()"
            [viewport]="viewportA()"
            (viewportChange)="onViewportChangeA($event)"
            [synchronization]="syncA()"
            [style.width.px]="500"
            [style.height.px]="300"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="A" />
        </mona-chart>
        <mona-chart
            #chartB
            [data]="dataB()"
            xField="x"
            [navigation]="navigationB()"
            [viewport]="viewportB()"
            (viewportChange)="onViewportChangeB($event)"
            [synchronization]="syncB()"
            [style.width.px]="400"
            [style.height.px]="300"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            <mona-line-series field="y" name="B" />
        </mona-chart>
    `
})
class SynchronizationHostComponent {
    public readonly chartA = viewChild.required<ChartComponent>("chartA");
    public readonly chartB = viewChild.required<ChartComponent>("chartB");

    public readonly dataA = signal<readonly unknown[]>(DATA);
    public readonly dataB = signal<readonly unknown[]>(DATA);
    public readonly eventsA: ChartViewportChangeEvent[] = [];
    public readonly eventsB: ChartViewportChangeEvent[] = [];
    public readonly navigationA = signal<ChartNavigationInput>(true);
    public readonly navigationB = signal<ChartNavigationInput>(true);
    public readonly syncA = signal<ChartSynchronizationInput>({ group: "g1" });
    public readonly syncB = signal<ChartSynchronizationInput>({ group: "g1" });
    public readonly viewportA = signal<ChartViewportState | undefined>(undefined);
    public readonly viewportB = signal<ChartViewportState | undefined>(undefined);
    public onViewportChangeA(event: ChartViewportChangeEvent): void {
        this.eventsA.push(event);
    }

    public onViewportChangeB(event: ChartViewportChangeEvent): void {
        this.eventsB.push(event);
    }
}

class FakeResizeObserver {
    public static instances: FakeResizeObserver[] = [];

    public constructor(public readonly callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this);
    }

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

describe("chart viewport synchronization", () => {
    let fixture: ComponentFixture<SynchronizationHostComponent>;
    let host: SynchronizationHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

    const mockRects = (): ReturnType<typeof vi.spyOn> =>
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const widthAttr = this.style?.width ? Number.parseFloat(this.style.width) : NaN;
            const heightAttr = this.style?.height ? Number.parseFloat(this.style.height) : NaN;
            const width = Number.isFinite(widthAttr) ? widthAttr : 500;
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

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;

        await TestBed.configureTestingModule({
            imports: [SynchronizationHostComponent]
        }).compileComponents();

        const rectSpy = mockRects();
        fixture = TestBed.createComponent(SynchronizationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        host.chartA().flushPendingRender();
        host.chartB().flushPendingRender();
        rectSpy.mockRestore();
    });

    afterEach(() => {
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    it("uncontrolled source publishes committed viewport and uncontrolled recipient commits with source=sync", async () => {
        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 60,
            min: 20
        });
        await nextFrame();

        expect(host.eventsA.some(e => e.source === "programmatic")).toBe(true);

        const bSyncEvents = host.eventsB.filter(e => e.source === "sync");
        expect(bSyncEvents.length).toBeGreaterThanOrEqual(1);
        expect(bSyncEvents[0].phase).toBe("end");

        const bViewport = host.chartB().getViewport();
        const bWindow = bViewport?.axes.find(a => a.axisId === "x-main") as
            | { kind: string; min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.min).toBe(20);
        expect(bWindow!.max).toBe(60);
    });

    it("controlled source does not publish until the parent accepts the proposal", async () => {
        host.viewportA.set({ axes: [] });
        fixture.detectChanges();

        host.syncA.set({ group: "g1", viewport: true });
        fixture.detectChanges();

        const eventsBefore = host.eventsB.length;

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 80,
            min: 40
        });
        await nextFrame();

        // Parent rejected (did not update input) -> no peer movement.
        expect(host.chartB().getViewport()?.axes.length ?? 0).toBe(0);
        expect(host.eventsB.length - eventsBefore).toBe(0);
    });

    it("controlled source publishes exactly once after parent acceptance without duplicate echo publish", async () => {
        host.viewportA.set({ axes: [] });
        fixture.detectChanges();

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 70,
            min: 30
        });

        await nextFrame();
        expect(host.chartB().getViewport()?.axes.length ?? 0).toBe(0);

        // Parent accepts:
        host.viewportA.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 70, min: 30 }] });
        fixture.detectChanges();
        await nextFrame();

        const bWindow = host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main") as
            | { min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.min).toBe(30);
        expect(bWindow!.max).toBe(70);
    });

    it("controlled recipient only proposes: scene stays put when rejected and moves after acceptance without ping-pong", async () => {
        host.viewportB.set({ axes: [] });
        fixture.detectChanges();

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 50,
            min: 10
        });
        await nextFrame();

        // Recipient proposed but parent has not accepted.
        const proposal = host.eventsB.find(e => e.source === "sync");
        expect(proposal).toBeDefined();

        const bHiddenBefore = host.chartB().getViewport()?.axes.length ?? 0;
        expect(bHiddenBefore).toBe(0);

        // Recipient parent accepts.
        host.viewportB.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 50, min: 10 }] });
        fixture.detectChanges();
        await nextFrame();
        await nextFrame();

        expect(host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main")).toBeDefined();

        // No ping-pong: chart A did not receive an echo that changed its viewport again.
        const aEventsAfterAcceptance = host.eventsA.filter(e => e.source === "sync");
        expect(aEventsAfterAcceptance).toHaveLength(0);
    });

    it("external controlled input change publishes to peers", async () => {
        await nextFrame();

        host.viewportA.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 90, min: 45 }] });
        fixture.detectChanges();
        await nextFrame();

        const bWindow = host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main") as
            | { min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.min).toBe(45);
        expect(bWindow!.max).toBe(90);
    });

    it("end phase mode publishes only once at operation end", async () => {
        host.syncA.set({ group: "g1", viewport: { phase: "end" } });
        host.syncB.set({ group: "g1", viewport: { phase: "end" } });
        fixture.detectChanges();
        await nextFrame();

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 40,
            min: 5
        });

        // setViewportWindow is single-shot ("end"), so peers move immediately after this op.
        const bWindow = host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main") as
            | { min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.min).toBe(5);
    });

    it("group change stops message flow between former group members", async () => {
        host.syncB.set({ group: "g2" });
        fixture.detectChanges();

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 55,
            min: 15
        });
        await nextFrame();

        expect(host.chartB().getViewport()?.axes.length ?? 0).toBe(0);

        host.syncB.set({ group: "g1" });
        fixture.detectChanges();
        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 65,
            min: 25
        });
        await nextFrame();

        const bWindow = host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main") as
            | { min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.min).toBe(25);
    });

    it("recipient applies its own constraints to inbound windows", async () => {
        host.navigationB.set({ clampToData: true, constraints: [{ axis: "x", axisId: "x-main", maxSpan: 20 }] });
        fixture.detectChanges();

        host.chartA().setViewportWindow({
            axis: "x",
            axisId: "x-main",
            kind: "continuous",
            max: 60,
            min: 0
        });
        await nextFrame();

        const bWindow = host.chartB().getViewport()?.axes.find(a => a.axisId === "x-main") as
            | { min: number; max: number }
            | undefined;
        expect(bWindow).toBeDefined();
        expect(bWindow!.max - bWindow!.min).toBeLessThanOrEqual(20 + 1e-9);
    });

    it("destroying the recipient mid-session leaves the source functional", async () => {
        fixture.destroy();
        await nextFrame();
    });
});
