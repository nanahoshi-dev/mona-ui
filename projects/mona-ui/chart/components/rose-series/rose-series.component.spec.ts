import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext, ChartSeriesRegistration } from "../../internal/context/chart-registration-context";
import type { ChartRadialDatumVisibilityEvent, ChartRoseScaleMode } from "../../models/chart-radial-arc.models";
import { MonaRoseSeriesComponent } from "./rose-series.component";

@Component({
    imports: [MonaRoseSeriesComponent],
    template: `
        <mona-rose-series
            [data]="data()"
            [field]="field()"
            [categoryField]="categoryField()"
            [scaleMode]="scaleMode()"
            [padAngle]="padAngle()"
            [(visible)]="visible"
            (datumVisibilityChange)="onDatumVisibilityChange($event)"
        />
    `
})
class TestRoseHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { category: "North", value: 45 },
        { category: "South", value: 85 }
    ]);
    public readonly field = signal("value");
    public readonly categoryField = signal("category");
    public readonly scaleMode = signal<ChartRoseScaleMode>("area");
    public readonly padAngle = signal(2);
    public readonly visible = signal(true);

    public lastVisibilityEvent: ChartRadialDatumVisibilityEvent | null = null;

    public onDatumVisibilityChange(event: ChartRadialDatumVisibilityEvent): void {
        this.lastVisibilityEvent = event;
    }
}

describe("MonaRoseSeriesComponent", () => {
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
            imports: [TestRoseHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestRoseHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("rose");
        expect(registeredSeries[0].name()).toBe("Rose");

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });

    it("supports toggling datum visibility and emitting datumVisibilityChange", () => {
        TestBed.configureTestingModule({
            imports: [TestRoseHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestRoseHostComponent);
        fixture.detectChanges();

        const seriesReg = registeredSeries[0];
        if (seriesReg.type === "rose") {
            expect(seriesReg.isDatumVisible("c:s:North")).toBe(true);
            const isNowVisible = seriesReg.toggleDatumVisibility("c:s:North");
            expect(isNowVisible).toBe(false);
            expect(seriesReg.isDatumVisible("c:s:North")).toBe(false);

            fixture.detectChanges();
            expect(fixture.componentInstance.lastVisibilityEvent).toEqual(
                expect.objectContaining({
                    category: "North",
                    dataIndex: 0,
                    itemId: "c:s:North",
                    seriesType: "rose",
                    visible: false
                })
            );
        }
    });

    it("prunes hidden item IDs when dataset changes", () => {
        TestBed.configureTestingModule({
            imports: [TestRoseHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestRoseHostComponent);
        fixture.detectChanges();

        const seriesReg = registeredSeries[0];
        if (seriesReg.type === "rose") {
            seriesReg.toggleDatumVisibility("c:s:North");
            expect(seriesReg.isDatumVisible("c:s:North")).toBe(false);

            // Update data removing North
            fixture.componentInstance.data.set([
                { category: "East", value: 50 }
            ]);
            fixture.detectChanges();

            // When North returns, it should be visible
            fixture.componentInstance.data.set([
                { category: "North", value: 45 }
            ]);
            fixture.detectChanges();

            expect(seriesReg.isDatumVisible("c:s:North")).toBe(true);
        }
    });
});
