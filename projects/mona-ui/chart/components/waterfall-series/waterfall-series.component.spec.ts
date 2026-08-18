import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartRegistrationContext,
    type ChartSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { WaterfallSeriesComponent } from "./waterfall-series.component";

@Component({
    imports: [WaterfallSeriesComponent],
    template: `
        <mona-waterfall-series
            [data]="data()"
            [field]="field()"
            [keyField]="keyField()"
            [startValue]="startValue()"
            [xField]="xField()"
            [(visible)]="visible" />
    `
})
class TestWaterfallHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "A", value: 100 },
        { category: "B", value: -40 }
    ]);
    public readonly field = signal("value");
    public readonly keyField = signal<string | undefined>(undefined);
    public readonly startValue = signal(0);
    public readonly xField = signal<string | undefined>("category");
    public readonly visible = signal(true);
}

describe("WaterfallSeriesComponent", () => {
    let registeredSeries: ChartSeriesRegistration[] = [];
    let lastInvalidationReason: ChartInvalidationReason | null = null;

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: (reason: ChartInvalidationReason) => {
            lastInvalidationReason = reason;
        },
        registerSeries: (reg: ChartSeriesRegistration) => {
            registeredSeries.push(reg);
            return () => {
                registeredSeries = registeredSeries.filter(r => r.id !== reg.id);
            };
        },
        rootData: signal([])
    };

    beforeEach(() => {
        registeredSeries = [];
        lastInvalidationReason = null;
    });

    it("registers itself with chart context on init and unregisters on destroy", () => {
        TestBed.configureTestingModule({
            imports: [TestWaterfallHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestWaterfallHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("waterfall");
        expect(registeredSeries[0].name()).toBe("Waterfall");

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });

    it("invalidates data when startValue changes", () => {
        TestBed.configureTestingModule({
            imports: [TestWaterfallHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestWaterfallHostComponent);
        fixture.detectChanges();

        fixture.componentInstance.startValue.set(500);
        fixture.detectChanges();

        expect(lastInvalidationReason).toBe(ChartInvalidationReason.Data);
    });
});
