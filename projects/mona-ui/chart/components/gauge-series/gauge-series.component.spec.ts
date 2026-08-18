import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartGaugeCenterTemplateDirective } from "../../directives/chart-gauge-center-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext, ChartSeriesRegistration } from "../../internal/context/chart-registration-context";
import type { ChartGaugeIndicator } from "../../models/chart-radial-arc.models";
import { MonaGaugeSeriesComponent } from "./gauge-series.component";

@Component({
    imports: [MonaGaugeSeriesComponent, ChartGaugeCenterTemplateDirective],
    template: `
        <mona-gauge-series
            [value]="value()"
            [min]="min()"
            [max]="max()"
            [indicator]="indicator()"
            [showValue]="showValue()"
            [(visible)]="visible"
        >
            <ng-template monaChartGaugeCenterTemplate let-val let-ratio="ratio">
                <span class="custom-center">{{ val }} ({{ ratio * 100 }}%)</span>
            </ng-template>
        </mona-gauge-series>
    `
})
class TestGaugeHostComponent {
    public readonly value = signal<number | undefined>(72);
    public readonly min = signal(0);
    public readonly max = signal(100);
    public readonly indicator = signal<ChartGaugeIndicator>("both");
    public readonly showValue = signal(true);
    public readonly visible = signal(true);
}

describe("MonaGaugeSeriesComponent", () => {
    let registeredSeries: ChartSeriesRegistration[] = [];
    let invalidatedReasons: number[] = [];

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: (reason?: number) => {
            if (reason !== undefined) {
                invalidatedReasons.push(reason);
            }
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
        invalidatedReasons = [];
    });

    it("registers itself with chart context on init and captures centerTemplate", () => {
        TestBed.configureTestingModule({
            imports: [TestGaugeHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestGaugeHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("gauge");
        expect(registeredSeries[0].name()).toBe("Gauge");

        const gaugeReg = registeredSeries[0];
        if (gaugeReg.type === "gauge") {
            expect(gaugeReg.value?.()).toBe(72);
            expect(gaugeReg.min()).toBe(0);
            expect(gaugeReg.max()).toBe(100);
            expect(gaugeReg.centerTemplate?.()).toBeDefined();
        }

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });
});
