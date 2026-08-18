import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext, ChartSeriesRegistration } from "../../internal/context/chart-registration-context";
import type { ChartRadialDatumVisibilityEvent } from "../../models/chart-radial-arc.models";
import { MonaRadialBarSeriesComponent } from "./radial-bar-series.component";

@Component({
    imports: [MonaRadialBarSeriesComponent],
    template: `
        <mona-radial-bar-series
            [data]="data()"
            [field]="field()"
            [categoryField]="categoryField()"
            [min]="min()"
            [max]="max()"
            [barGap]="barGap()"
            [startAngle]="startAngle()"
            [endAngle]="endAngle()"
            [(visible)]="visible"
            (datumVisibilityChange)="onDatumVisibilityChange($event)"
        />
    `
})
class TestRadialBarHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "A", value: 30 },
        { category: "B", value: 70 }
    ]);
    public readonly field = signal("value");
    public readonly categoryField = signal("category");
    public readonly min = signal<number | undefined>(0);
    public readonly max = signal<number | undefined>(100);
    public readonly barGap = signal(4);
    public readonly startAngle = signal(0);
    public readonly endAngle = signal(360);
    public readonly visible = signal(true);

    public lastVisibilityEvent: ChartRadialDatumVisibilityEvent | null = null;

    public onDatumVisibilityChange(event: ChartRadialDatumVisibilityEvent): void {
        this.lastVisibilityEvent = event;
    }
}

describe("MonaRadialBarSeriesComponent", () => {
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

    it("registers itself with chart context on init and unregisters on destroy", () => {
        TestBed.configureTestingModule({
            imports: [TestRadialBarHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestRadialBarHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("radialBar");
        expect(registeredSeries[0].name()).toBe("Radial Bar");

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });

    it("supports toggling datum visibility and emitting datumVisibilityChange", () => {
        TestBed.configureTestingModule({
            imports: [TestRadialBarHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestRadialBarHostComponent);
        fixture.detectChanges();

        const seriesReg = registeredSeries[0];
        if (seriesReg.type === "radialBar") {
            expect(seriesReg.isDatumVisible("A")).toBe(true);
            const isNowVisible = seriesReg.toggleDatumVisibility("A");
            expect(isNowVisible).toBe(false);
            expect(seriesReg.isDatumVisible("A")).toBe(false);

            fixture.detectChanges();
            expect(fixture.componentInstance.lastVisibilityEvent).toEqual(
                expect.objectContaining({
                    category: "A",
                    dataIndex: 0,
                    itemId: "A",
                    seriesType: "radialBar",
                    visible: false
                })
            );
        }
    });
});
