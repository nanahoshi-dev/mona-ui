import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../../components/chart/chart.component";
import { ChartCrosshairComponent } from "../../components/chart-crosshair/chart-crosshair.component";
import { ChartReferenceLineComponent } from "../../components/chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../../components/chart-reference-band/chart-reference-band.component";
import { ChartAnnotationComponent } from "../../components/chart-annotation/chart-annotation.component";
import { ChartXAxisComponent } from "../../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../../components/chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../../components/line-series/line-series.component";
import { CanvasChartRenderer } from "../render/canvas-chart-renderer";
import { CartesianStageTracker } from "../layout/cartesian-stage-instrumentation";
import { ChartOverlayLabelMeasureDirective } from "../directives/chart-overlay-label-measure.directive";

class TestResizeObserver {
    public static instances: TestResizeObserver[] = [];
    public readonly observed = new Set<Element>();
    public readonly unobserved = new Set<Element>();
    public disconnected = false;

    public constructor(public readonly callback: (entries: ResizeObserverEntry[]) => void) {
        TestResizeObserver.instances.push(this);
    }

    public observe(target: Element): void {
        this.observed.add(target);
        this.unobserved.delete(target);
    }

    public unobserve(target: Element): void {
        this.observed.delete(target);
        this.unobserved.add(target);
    }

    public disconnect(): void {
        this.disconnected = true;
        this.observed.clear();
    }

    public emit(entries: { height: number; target: Element; width: number }[]): void {
        const mapped = entries.map(e => ({
            contentRect: {
                bottom: e.height,
                height: e.height,
                left: 0,
                right: e.width,
                top: 0,
                width: e.width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            },
            target: e.target
        })) as unknown as ResizeObserverEntry[];
        this.callback(mapped);
    }
}

function getObserverFor(el: Element): TestResizeObserver {
    const observer = TestResizeObserver.instances.find(inst => inst.observed.has(el) || inst.unobserved.has(el));
    if (!observer) {
        throw new Error("TestResizeObserver instance not found for element");
    }
    return observer;
}

@Component({
    imports: [
        ChartComponent,
        ChartCrosshairComponent,
        ChartReferenceLineComponent,
        ChartReferenceBandComponent,
        ChartAnnotationComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent
    ],
    template: `
        <mona-chart [animation]="false" style="width: 500px; height: 300px;">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-line-series [data]="data()" xField="x" field="y" />

            <mona-chart-crosshair />
            <mona-chart-reference-line [value]="50" axis="y" />
            <mona-chart-reference-band [from]="20" [to]="40" axis="x" />
            <mona-chart-annotation
                [x]="annotationX()"
                [y]="annotationY()"
                [label]="annotationLabel()"
                [labelPlacement]="annotationPlacement()" />
        </mona-chart>
    `
})
class OverlayMeasurementPaintHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { x: 0, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 90 }
    ]);
    public readonly annotationX = signal(50);
    public readonly annotationY = signal(50);
    public readonly annotationLabel = signal("Annotated Point");
    public readonly annotationPlacement = signal<"bottom" | "left" | "right" | "top">("top");
}

describe("ChartOverlayMeasurementPaint (CAA-R6-003 / Gates N & O)", () => {
    const origResizeObserver = typeof window !== "undefined" ? window.ResizeObserver : undefined;
    let origGetContext: typeof HTMLCanvasElement.prototype.getContext | undefined;
    let globalRenderSpy: ReturnType<typeof vi.spyOn> | undefined;

    const stageEvents = {
        stageA: 0,
        stageB: 0,
        stageC: 0
    };

    function resetStageEvents(): void {
        stageEvents.stageA = 0;
        stageEvents.stageB = 0;
        stageEvents.stageC = 0;
    }

    beforeEach(async () => {
        TestResizeObserver.instances = [];
        window.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

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

        resetStageEvents();
        CartesianStageTracker.current = {
            onStageA: () => stageEvents.stageA++,
            onStageB: () => stageEvents.stageB++,
            onStageC: () => stageEvents.stageC++
        };

        TestBed.configureTestingModule({
            imports: [OverlayMeasurementPaintHostComponent]
        });
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        CartesianStageTracker.current = null;
        globalRenderSpy?.mockRestore();
        if (origResizeObserver) {
            window.ResizeObserver = origResizeObserver;
        }
        if (origGetContext) {
            HTMLCanvasElement.prototype.getContext = origGetContext;
        }
    });

    it("does not repaint canvas when crosshair badge element resizes via ResizeObserver callback (Gate N)", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const dummyEl = document.createElement("div");
        chart.observeOverlayLabelElement(dummyEl, "crosshair:x");

        globalRenderSpy?.mockClear();
        resetStageEvents();

        // Simulate ResizeObserver firing a size update for crosshair:x
        const observer = getObserverFor(dummyEl);
        observer.emit([{ height: 24, target: dummyEl, width: 80 }]);

        // Canvas paint is NOT triggered and Stage A/B/C are 0
        expect(globalRenderSpy).not.toHaveBeenCalled();
        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);

        chart.unobserveOverlayLabelElement(dummyEl, "crosshair:x");
    });

    it("does not repaint canvas when reference line or band badge element resizes (Gate N)", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const lineEl = document.createElement("div");
        chart.observeOverlayLabelElement(lineEl, "overlay:line:ref-1");

        const bandEl = document.createElement("div");
        chart.observeOverlayLabelElement(bandEl, "overlay:band:band-1");

        globalRenderSpy?.mockClear();
        resetStageEvents();

        const observer = getObserverFor(lineEl);
        observer.emit([
            { height: 20, target: lineEl, width: 60 },
            { height: 22, target: bandEl, width: 70 }
        ]);

        // Neither line nor band badge resize triggers canvas render or layout stages
        expect(globalRenderSpy).not.toHaveBeenCalled();
        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);

        chart.unobserveOverlayLabelElement(lineEl, "overlay:line:ref-1");
        chart.unobserveOverlayLabelElement(bandEl, "overlay:band:band-1");
    });

    it("cleans up overlay measurements and unobserves elements with per-instance tracking", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();

        const elements: { el: HTMLElement; id: string }[] = [];
        for (let i = 0; i < 10; i++) {
            const el = document.createElement("div");
            const id = `overlay:line:bulk-${i}`;
            chart.observeOverlayLabelElement(el, id);
            elements.push({ el, id });
        }

        const observer = getObserverFor(elements[0].el);

        for (const item of elements) {
            expect(observer.observed.has(item.el)).toBe(true);
            chart.unobserveOverlayLabelElement(item.el, item.id);
            expect(observer.observed.has(item.el)).toBe(false);
            expect(observer.unobserved.has(item.el)).toBe(true);
        }
    });

    it("proves stale callback cannot affect removed unobserved element", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const dummyEl = document.createElement("div");
        chart.observeOverlayLabelElement(dummyEl, "overlay:ann:ann-stale");

        const observer = getObserverFor(dummyEl);
        chart.unobserveOverlayLabelElement(dummyEl, "overlay:ann:ann-stale");

        globalRenderSpy?.mockClear();
        resetStageEvents();

        // Emit synthetic entry for unobserved element
        observer.emit([{ height: 50, target: dummyEl, width: 200 }]);

        expect(globalRenderSpy).not.toHaveBeenCalled();
        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);
    });

    it("cleans up measurement registry on unobserve so subsequent observation is treated as fresh", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const el1 = document.createElement("div");
        const labelId = "overlay:line:reobserve-test";
        chart.observeOverlayLabelElement(el1, labelId);

        const observer = getObserverFor(el1);
        observer.emit([{ height: 30, target: el1, width: 100 }]);

        // Unobserve el1
        chart.unobserveOverlayLabelElement(el1, labelId);

        // Re-observe same labelId with new element el2
        const el2 = document.createElement("div");
        chart.observeOverlayLabelElement(el2, labelId);

        globalRenderSpy?.mockClear();
        resetStageEvents();

        // Fresh measurement with same dimensions should still be recorded cleanly
        observer.emit([{ height: 30, target: el2, width: 100 }]);

        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);

        chart.unobserveOverlayLabelElement(el2, labelId);
    });

    it("disconnects ResizeObserver and releases tracked elements on fixture destroy", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const chart = fixture.componentInstance.chart();
        const dummyEl = document.createElement("div");
        chart.observeOverlayLabelElement(dummyEl, "overlay:ann:ann-destroy-test");

        const observer = getObserverFor(dummyEl);
        expect(observer.observed.has(dummyEl)).toBe(true);

        fixture.destroy();

        expect(observer.disconnected).toBe(true);
        expect(observer.observed.size).toBe(0);
    });

    it("annotation resize with unchanged effective anchor does not paint canvas", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.componentInstance.annotationX.set(50);
        fixture.componentInstance.annotationY.set(50);
        fixture.componentInstance.annotationPlacement.set("top");
        fixture.detectChanges();
        await fixture.whenStable();

        // Find the annotation directive in the DOM
        const directiveDebugEl = fixture.debugElement
            .queryAll(By.directive(ChartOverlayLabelMeasureDirective))
            .find(de => de.injector.get(ChartOverlayLabelMeasureDirective).labelId().startsWith("overlay:ann:"));

        expect(directiveDebugEl).toBeDefined();
        const annEl = directiveDebugEl!.nativeElement;
        const observer = getObserverFor(annEl);

        // Initial measurement far from edges
        observer.emit([{ height: 24, target: annEl, width: 80 }]);
        fixture.detectChanges();

        globalRenderSpy?.mockClear();
        resetStageEvents();

        // Resize badge slightly; still fits comfortably far from chart bounds (unchanged anchor)
        observer.emit([{ height: 24, target: annEl, width: 90 }]);

        expect(globalRenderSpy).not.toHaveBeenCalled();
        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);
    });

    it("annotation resize causing clamp-anchor change executes exactly one Canvas paint", async () => {
        const fixture = TestBed.createComponent(OverlayMeasurementPaintHostComponent);
        fixture.componentInstance.annotationX.set(100);
        fixture.componentInstance.annotationY.set(90);
        fixture.componentInstance.annotationPlacement.set("right");
        fixture.detectChanges();
        await fixture.whenStable();

        const directiveDebugEl = fixture.debugElement
            .queryAll(By.directive(ChartOverlayLabelMeasureDirective))
            .find(de => de.injector.get(ChartOverlayLabelMeasureDirective).labelId().startsWith("overlay:ann:"));

        expect(directiveDebugEl).toBeDefined();
        const annEl = directiveDebugEl!.nativeElement;
        const observer = getObserverFor(annEl);

        // First measurement: narrow badge fits
        observer.emit([{ height: 20, target: annEl, width: 20 }]);
        fixture.detectChanges();
        await fixture.whenStable();

        globalRenderSpy?.mockClear();
        resetStageEvents();

        // Second measurement: wide badge overflows right edge of container, causing clamp-anchor change
        observer.emit([{ height: 20, target: annEl, width: 350 }]);

        // Exactly one canvas paint occurs to update the connector endpoint
        expect(globalRenderSpy).toHaveBeenCalledTimes(1);
        // Stage A/B/C layout stages remain 0 (no structural recalculation)
        expect(stageEvents.stageA).toBe(0);
        expect(stageEvents.stageB).toBe(0);
        expect(stageEvents.stageC).toBe(0);
    });
});
