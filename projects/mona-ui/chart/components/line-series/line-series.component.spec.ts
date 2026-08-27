import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartLineSeriesRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import type { ChartCurve, ChartLineStyle } from "../../models/chart-series.models";
import type { ChartField } from "../../models/chart.models";
import { ChartComponent } from "../chart/chart.component";
import { LineSeriesComponent } from "./line-series.component";


@Component({
    imports: [ChartComponent, LineSeriesComponent],
    template: `
        <mona-chart [data]="data()">
            <mona-line-series
                [field]="field()"
                [xField]="xField()"
                [name]="name()"
                [color]="color()"
                [curve]="curve()"
                [lineStyle]="lineStyle()"
                [connectNulls]="connectNulls()"
                [showPoints]="showPoints()"
                [pointRadius]="pointRadius()"
                [strokeWidth]="strokeWidth()"
                [class]="userClass()"
                [(visible)]="visible" />
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly color = signal("#3b82f6");
    public readonly connectNulls = signal(false);
    public readonly curve = signal<ChartCurve>("linear");
    public readonly data = signal<readonly unknown[]>([
        { value: 10, x: 0 },
        { value: 25, x: 1 },
        { value: 40, x: 2 }
    ]);
    public readonly field = signal<ChartField>("value");
    public readonly lineStyle = signal<ChartLineStyle>("solid");
    public readonly name = signal("Actual");
    public readonly pointRadius = signal<number | undefined>(4);
    public readonly showPoints = signal(true);
    public readonly strokeWidth = signal<number | undefined>(2);
    public readonly userClass = signal("custom-line");
    public readonly visible = signal(true);
    public readonly xField = signal<ChartField | undefined>("x");
}

@Component({
    imports: [LineSeriesComponent],
    template: `
        <mona-line-series
            [field]="field()"
            [lineStyle]="lineStyle()" />
    `
})
class IsolatedLineSeriesHostComponent {
    public readonly field = signal<ChartField>("value");
    public readonly lineStyle = signal<ChartLineStyle>("solid");
}

describe("LineSeriesComponent", () => {
    describe("Full Chart Integration", () => {
        let fixture: ComponentFixture<TestHostComponent>;
        let host: TestHostComponent;
        let seriesComponent: LineSeriesComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestHostComponent);
            host = fixture.componentInstance;
            fixture.detectChanges();
            seriesComponent = fixture.debugElement.query(By.directive(LineSeriesComponent)).componentInstance;
        });

        it("should instantiate and bind default inputs correctly", () => {
            expect(seriesComponent).toBeDefined();
            expect(seriesComponent.name()).toBe("Actual");
            expect(seriesComponent.field()).toBe("value");
            expect(seriesComponent.xField()).toBe("x");
            expect(seriesComponent.lineStyle()).toBe("solid");
            expect(seriesComponent.showPoints()).toBe(true);
            expect(seriesComponent.visible()).toBe(true);
        });

        it("should keep host element hidden with aria-hidden", () => {
            const el = fixture.nativeElement.querySelector("mona-line-series") as HTMLElement;
            expect(el).not.toBeNull();
            expect(el.getAttribute("aria-hidden")).toBe("true");
            expect(el.style.display).toBe("none");
        });

        it("should react to dynamic lineStyle updates", () => {
            expect(seriesComponent.lineStyle()).toBe("solid");

            host.lineStyle.set("dashed");
            fixture.detectChanges();
            expect(seriesComponent.lineStyle()).toBe("dashed");

            host.lineStyle.set("dotted");
            fixture.detectChanges();
            expect(seriesComponent.lineStyle()).toBe("dotted");

            host.lineStyle.set("solid");
            fixture.detectChanges();
            expect(seriesComponent.lineStyle()).toBe("solid");
        });

        it("should update two-way visible model", () => {
            host.visible.set(false);
            fixture.detectChanges();
            expect(seriesComponent.visible()).toBe(false);

            seriesComponent.visible.set(true);
            fixture.detectChanges();
            expect(host.visible()).toBe(true);
        });
    });

    describe("Reactive Invalidation with Mock Context", () => {
        it("should register lineStyle signal and trigger ChartInvalidationReason.Style on dynamic mutation", () => {
            let registeredSeries: ChartLineSeriesRegistration | undefined;
            const invalidateSpy = vi.fn();

            const fakeContext: Partial<ChartRegistrationContext> = {
                invalidate: invalidateSpy,
                registerSeries: (reg) => {
                    registeredSeries = reg as ChartLineSeriesRegistration;
                    return () => {};
                }
            };

            const isolatedFixture = TestBed.configureTestingModule({
                imports: [IsolatedLineSeriesHostComponent],
                providers: [{ provide: CHART_CONTEXT, useValue: fakeContext }]
            }).createComponent(IsolatedLineSeriesHostComponent);

            isolatedFixture.detectChanges();

            expect(registeredSeries).toBeDefined();
            expect(registeredSeries?.lineStyle?.()).toBe("solid");

            // Clear initialization effects
            invalidateSpy.mockClear();

            // Mutate lineStyle
            isolatedFixture.componentInstance.lineStyle.set("dashed");
            isolatedFixture.detectChanges();

            // Must invalidate with Style
            expect(invalidateSpy).toHaveBeenCalledWith(ChartInvalidationReason.Style);
            // Must NOT invalidate with Data or Layout
            expect(invalidateSpy).not.toHaveBeenCalledWith(ChartInvalidationReason.Data);
            expect(invalidateSpy).not.toHaveBeenCalledWith(ChartInvalidationReason.Layout);
            // Captured registration signal must reflect new value
            expect(registeredSeries?.lineStyle?.()).toBe("dashed");
        });
    });
});

