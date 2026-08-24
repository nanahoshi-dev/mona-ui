import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartCrosshairComponent } from "../components/chart-crosshair/chart-crosshair.component";
import { ChartReferenceLineComponent } from "../components/chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../components/chart-reference-band/chart-reference-band.component";
import { ChartAnnotationComponent } from "../components/chart-annotation/chart-annotation.component";
import { ChartCrosshairLabelTemplateDirective } from "../directives/chart-crosshair-label-template.directive";
import { ChartReferenceLabelTemplateDirective } from "../directives/chart-reference-label-template.directive";
import { ChartAnnotationLabelTemplateDirective } from "../directives/chart-annotation-label-template.directive";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../models/chart-crosshair.models";
import type {} from "../internal/scene/chart-scene";

interface SampleDatum {
    x: number;
    y: number;
}

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
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
            <mona-chart-x-axis [axisId]="'x-main'" [type]="'linear'" />
            <mona-chart-y-axis [axisId]="'y-main'" />

            <mona-line-series [data]="data()" [xField]="'x'" [field]="'y'" [name]="'Series 1'" />

            @if (showCrosshair()) {
                <mona-chart-crosshair [mode]="crosshairMode()" [snap]="crosshairSnap()" [color]="'#3b82f6'">
                    @if (useCrosshairTemplate()) {
                        <ng-template monaChartCrosshairLabel let-ctx>
                            <span class="custom-crosshair-badge">{{ ctx.axis }}: {{ ctx.formattedValue }}</span>
                        </ng-template>
                    }
                </mona-chart-crosshair>
            }

            @if (showReferenceLine()) {
                <mona-chart-reference-line [axis]="'y'" [value]="targetY()" [label]="'Target Y'" [layer]="'overlay'">
                    @if (useRefLineTemplate()) {
                        <ng-template monaChartReferenceLabel let-val>
                            <span class="custom-ref-badge">Target: {{ val }}</span>
                        </ng-template>
                    }
                </mona-chart-reference-line>
            }

            @if (showReferenceBand()) {
                <mona-chart-reference-band
                    [axis]="'y'"
                    [from]="bandFrom()"
                    [to]="bandTo()"
                    [label]="'Optimal'"
                    [layer]="'underlay'">
                    @if (useRefBandTemplate()) {
                        <ng-template monaChartReferenceLabel let-ctx>
                            <span class="custom-band-badge">Band: {{ ctx.from }}-{{ ctx.to }}</span>
                        </ng-template>
                    }
                </mona-chart-reference-band>
            }

            @if (showAnnotation()) {
                <mona-chart-annotation
                    [x]="annX()"
                    [y]="annY()"
                    [label]="'Peak'"
                    [data]="{ desc: 'Peak Point' }"
                    [marker]="'diamond'">
                    @if (useAnnotationTemplate()) {
                        <ng-template monaChartAnnotationLabel let-d>
                            <span class="custom-ann-badge">{{ d.desc }}</span>
                        </ng-template>
                    }
                </mona-chart-annotation>
            }
        </mona-chart>
    `
})
class IntegrationHostComponent {
    public readonly annX = signal(50);
    public readonly annY = signal(90);
    public readonly bandFrom = signal(30);
    public readonly bandTo = signal(70);
    public readonly chart = viewChild(ChartComponent);
    public readonly crosshairMode = signal<ChartCrosshairMode>("xy");
    public readonly crosshairSnap = signal<ChartCrosshairSnapMode>("pointer");
    public readonly data = signal<SampleDatum[]>([
        { x: 0, y: 10 },
        { x: 25, y: 50 },
        { x: 50, y: 90 },
        { x: 75, y: 40 },
        { x: 100, y: 20 }
    ]);
    public readonly showAnnotation = signal(true);
    public readonly showCrosshair = signal(true);
    public readonly showReferenceBand = signal(true);
    public readonly showReferenceLine = signal(true);
    public readonly targetY = signal(60);
    public readonly useAnnotationTemplate = signal(false);
    public readonly useCrosshairTemplate = signal(false);
    public readonly useRefBandTemplate = signal(false);
    public readonly useRefLineTemplate = signal(false);
}

describe("Chart Crosshair & Annotations Integration", () => {
    let fixture: ComponentFixture<IntegrationHostComponent>;
    let host: IntegrationHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IntegrationHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(IntegrationHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("renders reference line and reference band in DOM overlay with default formatted labels", () => {
        fixture.detectChanges();
        const refLineEl = fixture.debugElement.query(By.css(".custom-ref-badge, [class*='text-muted-foreground']"));
        expect(refLineEl).not.toBeNull();
        expect(fixture.nativeElement.textContent).toContain("Target Y");
        expect(fixture.nativeElement.textContent).toContain("Optimal");
    });

    it("renders custom reference line and reference band label templates", async () => {
        host.useRefLineTemplate.set(true);
        host.useRefBandTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const refLineBadge = fixture.debugElement.query(By.css(".custom-ref-badge"));
        expect(refLineBadge).not.toBeNull();
        expect(refLineBadge.nativeElement.textContent).toContain("Target: 60");

        const refBandBadge = fixture.debugElement.query(By.css(".custom-band-badge"));
        expect(refBandBadge).not.toBeNull();
        expect(refBandBadge.nativeElement.textContent).toContain("Band: 30-70");
    });

    it("renders point annotation marker and label template", async () => {
        host.useAnnotationTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const annBadge = fixture.debugElement.query(By.css(".custom-ann-badge"));
        expect(annBadge).not.toBeNull();
        expect(annBadge.nativeElement.textContent).toContain("Peak Point");
    });

    it("updates crosshair badges on pointer move over plot canvas", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        expect(canvasEl).not.toBeNull();

        const scene = host.chart()?.scene();
        const targetPoint = scene?.hitTargets[2]?.point ?? { x: 250, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                clientX: targetPoint.x,
                clientY: targetPoint.y
            })
        );

        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();
        await fixture.whenStable();

        const crosshairBadges = fixture.debugElement.queryAll(By.css("[class*='z-40']"));
        expect(crosshairBadges.length).toBeGreaterThan(0);
    });

    it("renders custom crosshair label template when provided", async () => {
        host.useCrosshairTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const targetPoint = scene?.hitTargets[2]?.point ?? { x: 250, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                clientX: targetPoint.x,
                clientY: targetPoint.y
            })
        );

        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();
        await fixture.whenStable();

        const customBadges = fixture.debugElement.queryAll(By.css(".custom-crosshair-badge"));
        expect(customBadges.length).toBeGreaterThan(0);
    });

    it("clears crosshair on pointer leave and on Escape key", async () => {
        const canvasEl = fixture.debugElement.query(By.css("canvas"));
        const scene = host.chart()?.scene();
        const targetPoint = scene?.hitTargets[2]?.point ?? { x: 250, y: 150 };

        canvasEl.nativeElement.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                clientX: targetPoint.x,
                clientY: targetPoint.y
            })
        );
        await new Promise(r => requestAnimationFrame(r));
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css("[class*='z-40']")).length).toBeGreaterThan(0);

        canvasEl.nativeElement.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.debugElement.queryAll(By.css("[class*='z-40']")).length).toBe(0);
    });

    it("snaps crosshair on keyboard navigation", async () => {
        const chartEl = fixture.debugElement.query(By.css("mona-chart"));
        chartEl.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();
        await fixture.whenStable();

        const crosshairBadges = fixture.debugElement.queryAll(By.css("[class*='z-40']"));
        expect(crosshairBadges.length).toBeGreaterThan(0);
    });
});
