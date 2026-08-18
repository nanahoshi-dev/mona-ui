import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type {
    ChartRegistrationContext,
    ChartSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { WaterfallSeriesComponent } from "./waterfall-series.component";

@Component({
    imports: [WaterfallSeriesComponent],
    template: `
        <mona-waterfall-series
            [data]="data()"
            [field]="field()"
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
    public readonly xField = signal("category");
    public readonly visible = signal(true);
}

describe("WaterfallSeriesComponent", () => {
    let registeredSeries: ChartSeriesRegistration[] = [];

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: () => {},
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
});
