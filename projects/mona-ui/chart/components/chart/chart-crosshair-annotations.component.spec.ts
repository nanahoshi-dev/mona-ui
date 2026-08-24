import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { RangeBarSeriesComponent } from "../range-bar-series/range-bar-series.component";
import { CandlestickSeriesComponent } from "../candlestick-series/candlestick-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartCrosshairComponent } from "../chart-crosshair/chart-crosshair.component";
import { ChartReferenceLineComponent } from "../chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../chart-reference-band/chart-reference-band.component";
import { ChartAnnotationComponent } from "../chart-annotation/chart-annotation.component";
import { ChartCrosshairLabelTemplateDirective } from "../../directives/chart-crosshair-label-template.directive";
import { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import { ChartAnnotationLabelTemplateDirective } from "../../directives/chart-annotation-label-template.directive";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../../models/chart-crosshair.models";
import type { ChartAnnotationLabelPlacement, ChartAnnotationAxisValue } from "../../models/chart-annotation.models";

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
        RangeBarSeriesComponent,
        CandlestickSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartCrosshairComponent,
        ChartReferenceLineComponent,
        ChartReferenceBandComponent,
        ChartAnnotationComponent,
        ChartCrosshairLabelTemplateDirective,
        ChartReferenceLabelTemplateDirective,
        ChartAnnotationLabelTemplateDirective
    ],
    template: `
        <mona-chart [animation]="false" style="width: 500px; height: 300px;">
            <mona-chart-x-axis [axisId]="'x-main'" [type]="'category'" [formatter]="xFormatter" />
            <mona-chart-x-axis [axisId]="'x-secondary'" [position]="'top'" [min]="0" [max]="100" [type]="'linear'" />
            <mona-chart-y-axis [axisId]="'y-main'" [formatter]="yFormatter" />
            <mona-chart-y-axis [axisId]="'y-secondary'" [position]="'right'" [min]="0" [max]="500" [formatter]="ySecFormatter" />

            @if (seriesKind() === 'line') {
                <mona-line-series [data]="categoryData()" [xField]="'category'" [field]="'value'" [name]="'Line A'" [xAxisId]="'x-main'" [yAxisId]="seriesYAxisId()" />
            }
            @if (seriesKind() === 'range') {
                <mona-range-bar-series [data]="rangeData()" [xField]="'category'" [fromField]="'from'" [toField]="'to'" [name]="'Range A'" [xAxisId]="'x-main'" [yAxisId]="'y-main'" />
            }
            @if (seriesKind() === 'candlestick') {
                <mona-candlestick-series
                    [data]="financialData()"
                    [xField]="'category'"
                    [openField]="'open'"
                    [highField]="'high'"
                    [lowField]="'low'"
                    [closeField]="'close'"
                    [name]="'Financial A'"
                    [xAxisId]="'x-main'"
                    [yAxisId]="'y-main'" />
            }

            @if (showCrosshair()) {
                <mona-chart-crosshair
                    [enabled]="crosshairEnabled()"
                    [mode]="crosshairMode()"
                    [snap]="crosshairSnap()"
                    [maxSnapDistance]="crosshairMaxSnapDist()"
                    [xAxisId]="crosshairXAxisId()"
                    [yAxisId]="crosshairYAxisId()">
                    @if (useCrosshairTemplate()) {
                        <ng-template monaChartCrosshairLabel let-val let-axis="axis" let-fv="formattedValue">
                            <span class="rg-crosshair-badge">{{ axis }}: {{ fv }}</span>
                        </ng-template>
                    }
                </mona-chart-crosshair>
            }

            @if (showReferenceLine()) {
                <mona-chart-reference-line
                    [axis]="'y'"
                    [axisId]="refLineAxisId()"
                    [value]="refLineValue()"
                    [label]="'Threshold'"
                    [class]="refLineUserClass()">
                    @if (useRefLineTemplate()) {
                        <ng-template monaChartReferenceLabel let-val let-fv="formattedValue">
                            <span class="rg-ref-line-badge">Ref: {{ fv }}</span>
                        </ng-template>
                    }
                </mona-chart-reference-line>
            }

            @if (showReferenceBand()) {
                <mona-chart-reference-band
                    [axis]="'x'"
                    [axisId]="refBandAxisId()"
                    [from]="refBandFrom()"
                    [to]="refBandTo()"
                    [label]="'Band'"
                    [class]="refBandUserClass()">
                    @if (useRefBandTemplate()) {
                        <ng-template monaChartReferenceLabel let-ctx let-ff="formattedFrom" let-ft="formattedTo">
                            <span class="rg-ref-band-badge">From: {{ ff }} To: {{ ft }}</span>
                        </ng-template>
                    }
                </mona-chart-reference-band>
            }

            @if (showAnnotation()) {
                <mona-chart-annotation
                    [x]="annX()"
                    [y]="annY()"
                    [xAxisId]="annXAxisId()"
                    [yAxisId]="annYAxisId()"
                    [label]="'Peak'"
                    [labelPlacement]="annPlacement()"
                    [offsetX]="annOffsetX()"
                    [offsetY]="annOffsetY()"
                    [class]="annUserClass()">
                    @if (useAnnotationTemplate()) {
                        <ng-template monaChartAnnotationLabel let-d let-fx="formattedX" let-fy="formattedY">
                            <span class="rg-annotation-badge">X: {{ fx }}, Y: {{ fy }}</span>
                        </ng-template>
                    }
                </mona-chart-annotation>
            }
        </mona-chart>
    `
})
class ReleaseGateHostComponent {
    public readonly annOffsetX = signal(0);
    public readonly annOffsetY = signal(0);
    public readonly annPlacement = signal<ChartAnnotationLabelPlacement>("top");
    public readonly annUserClass = signal("custom-ann-cls");
    public readonly annX = signal<ChartAnnotationAxisValue>("Feb");
    public readonly annXAxisId = signal<string | undefined>("x-main");
    public readonly annY = signal<ChartAnnotationAxisValue>(200);
    public readonly annYAxisId = signal<string | undefined>("y-main");
    public readonly categoryData = signal([
        { category: "Jan", value: 100 },
        { category: "Feb", value: 200 },
        { category: "Mar", value: 150 },
        { category: "Apr", value: 300 }
    ]);
    public readonly chart = viewChild(ChartComponent);
    public readonly crosshairEnabled = signal(true);
    public readonly crosshairMaxSnapDist = signal(32);
    public readonly crosshairMode = signal<ChartCrosshairMode>("xy");
    public readonly crosshairSnap = signal<ChartCrosshairSnapMode>("nearest");
    public readonly crosshairXAxisId = signal<string | undefined>(undefined);
    public readonly crosshairYAxisId = signal<string | undefined>(undefined);
    public readonly financialData = signal([
        { category: "Jan", open: 100, high: 140, low: 90, close: 120 },
        { category: "Feb", open: 120, high: 180, low: 110, close: 160 },
        { category: "Mar", open: 160, high: 170, low: 130, close: 140 }
    ]);
    public readonly rangeData = signal([
        { category: "Jan", from: 50, to: 150 },
        { category: "Feb", from: 120, to: 260 },
        { category: "Mar", from: 80, to: 200 }
    ]);
    public readonly refBandAxisId = signal<string | undefined>("x-main");
    public readonly refBandFrom = signal<ChartAnnotationAxisValue>("Jan");
    public readonly refBandTo = signal<ChartAnnotationAxisValue>("Mar");
    public readonly refBandUserClass = signal("custom-band-cls");
    public readonly refLineAxisId = signal<string | undefined>("y-main");
    public readonly refLineUserClass = signal("custom-line-cls");
    public readonly refLineValue = signal<ChartAnnotationAxisValue>(150);
    public readonly seriesKind = signal<"line" | "range" | "candlestick">("line");
    public readonly seriesYAxisId = signal<string | undefined>("y-main");

    // Annotation state
    public readonly showAnnotation = signal(true);
    // Crosshair state
    public readonly showCrosshair = signal(true);
    // Reference Band state
    public readonly showReferenceBand = signal(true);
    // Reference Line state
    public readonly showReferenceLine = signal(true);
    public readonly useAnnotationTemplate = signal(false);
    public readonly useCrosshairTemplate = signal(false);
    public readonly useRefBandTemplate = signal(false);
    public readonly useRefLineTemplate = signal(false);
    public readonly xFormatter = (v: unknown) => `M_${String(v)}`;
    public readonly yFormatter = (v: unknown) => `$${Number(v).toFixed(0)}`;
    public readonly ySecFormatter = (v: unknown) => `${Number(v)}%`;
}

describe("Chart Crosshairs and Annotations", () => {
    let fixture: ComponentFixture<ReleaseGateHostComponent>;
    let host: ReleaseGateHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReleaseGateHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ReleaseGateHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    // 1. CAA-R2-004 & CAA-R2-005: Multi-axis Crosshair Namespacing and Candidate Rejection
    it("namespaces crosshair coordinates and formatted values to target secondary axis", async () => {
        host.seriesYAxisId.set("y-secondary");
        host.crosshairYAxisId.set("y-secondary");
        fixture.detectChanges();
        await fixture.whenStable();

        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[1]?.point ?? { x: 150, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.y?.axisId).toBe("y-secondary");
    });

    // 2. CAA-R2-001 & CAA-R2-003: Non-scalar Mark Nearest Snapping (Financial & Range series)
    it("snaps nearest crosshair to financial candlestick close coordinate", async () => {
        host.seriesKind.set("candlestick");
        fixture.detectChanges();
        await fixture.whenStable();

        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[0]?.point ?? { x: 100, y: 100 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.snapped).toBe(true);
        expect(chState?.y?.value).toBe(120); // close price of Jan
    });

    it("snaps nearest crosshair to nearest boundary of range series", async () => {
        host.seriesKind.set("range");
        fixture.detectChanges();
        await fixture.whenStable();

        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[0]?.point ?? { x: 100, y: 100 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        const chState = host.chart()?.["crosshairState"]();
        expect(chState).not.toBeNull();
        expect(chState?.snapped).toBe(true);
        expect(chState?.y?.value).toBeDefined();
    });

    // 3. CAA-R2-010 & CAA-R2-011: Axis Formatted Values in Overlay Templates & Base Domain Indices
    it("passes axis-formatted values to Reference Line, Reference Band, and Annotation templates", async () => {
        host.useRefLineTemplate.set(true);
        host.useRefBandTemplate.set(true);
        host.useAnnotationTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const refLineBadge = fixture.debugElement.query(By.css(".rg-ref-line-badge"));
        expect(refLineBadge).not.toBeNull();
        expect(refLineBadge.nativeElement.textContent).toContain("Ref: $150");

        const refBandBadge = fixture.debugElement.query(By.css(".rg-ref-band-badge"));
        expect(refBandBadge).not.toBeNull();
        expect(refBandBadge.nativeElement.textContent).toContain("From: M_Jan To: M_Mar");

        const annBadge = fixture.debugElement.query(By.css(".rg-annotation-badge"));
        expect(annBadge).not.toBeNull();
        expect(annBadge.nativeElement.textContent).toContain("X: M_Feb, Y: $200");
    });

    it("projects category reference bands spanning across category domain with proper formatted base endpoints", () => {
        const overlayScene = host.chart()?.["cartesianOverlayScene"]();
        expect(overlayScene).not.toBeNull();
        expect(overlayScene?.referenceBands.length).toBe(1);
        const band = overlayScene!.referenceBands[0];
        expect(band.formattedFrom).toBe("M_Jan");
        expect(band.formattedTo).toBe("M_Mar");
        expect(band.bounds.width).toBeGreaterThan(0);
    });

    it("computes normalized annotation anchor coordinates for placements", () => {
        const overlayScene = host.chart()?.["cartesianOverlayScene"]();
        expect(overlayScene).not.toBeNull();
        const ann = overlayScene!.annotations[0];
        expect(ann.label).toBeDefined();
        expect(ann.label?.offsetY).toBe(0);
        // Default top placement shifts label anchor by -12px
        expect(ann.label!.anchor.y).toBe(ann.point.y - 12);
    });

    // 4. CAA-R2-006 & CAA-R2-007: Interaction Authority Retirement & Stale Pointer Clearance
    it("dynamically hides crosshair badges when crosshair.enabled is set to false", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[1]?.point ?? { x: 150, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(host.chart()?.["crosshairState"]()).not.toBeNull();

        host.crosshairEnabled.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.chart()?.["crosshairState"]()).toBeNull();
    });

    it("unconditionally clears pointer interaction state on pointerleave without stale resurrection", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[1]?.point ?? { x: 150, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(host.chart()?.["crosshairState"]()).not.toBeNull();

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointerleave", { bubbles: true })
        );
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.chart()?.["crosshairState"]()).toBeNull();

        // Mutating maxSnapDistance after pointer leave should NOT resurrect crosshair
        host.crosshairMaxSnapDist.set(64);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.chart()?.["crosshairState"]()).toBeNull();
    });

    it("retires transient crosshair and pointer state when keyboard or escape is triggered", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const pt = scene?.hitTargets[1]?.point ?? { x: 150, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true, clientX: pt.x, clientY: pt.y })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(host.chart()?.["crosshairState"]()).not.toBeNull();

        const chartEl = fixture.debugElement.query(By.css("mona-chart"));
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.chart()?.["crosshairState"]()).toBeNull();
    });
});
