import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type {
    ChartRegistrationContext,
    ChartSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type {
    ChartFunnelOrientation,
    ChartFunnelStageVisibilityEvent
} from "../../models/chart-funnel.models";
import { FunnelSeriesComponent } from "./funnel-series.component";

@Component({
    imports: [FunnelSeriesComponent],
    template: `
        <mona-funnel-series
            [data]="data()"
            [field]="field()"
            [categoryField]="categoryField()"
            [orientation]="orientation()"
            [(visible)]="visible"
            (stageVisibilityChange)="onStageVisibilityChange($event)" />
    `
})
class TestFunnelHostComponent {
    public readonly data = signal<readonly unknown[]>([
        { stage: "Stage 1", value: 100 },
        { stage: "Stage 2", value: 50 }
    ]);
    public readonly field = signal("value");
    public readonly categoryField = signal("stage");
    public readonly orientation = signal<ChartFunnelOrientation>("vertical");
    public readonly visible = signal(true);

    public lastVisibilityEvent: ChartFunnelStageVisibilityEvent | null = null;

    public onStageVisibilityChange(event: ChartFunnelStageVisibilityEvent): void {
        this.lastVisibilityEvent = event;
    }
}

describe("FunnelSeriesComponent", () => {
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
            imports: [TestFunnelHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestFunnelHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("funnel");
        expect(registeredSeries[0].name()).toBe("Funnel");

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });

    it("supports toggling stage visibility and emitting stageVisibilityChange with full metadata", () => {
        TestBed.configureTestingModule({
            imports: [TestFunnelHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestFunnelHostComponent);
        fixture.detectChanges();

        const funnelReg = registeredSeries[0];
        if (funnelReg.type !== "funnel") {
            throw new Error("Expected funnel registration");
        }

        expect(funnelReg.isDatumVisible("i:0")).toBe(true);

        // Toggle stage 0 visibility off
        funnelReg.toggleDatumVisibility?.("i:0");
        fixture.detectChanges();

        expect(funnelReg.isDatumVisible("i:0")).toBe(false);
        expect(fixture.componentInstance.lastVisibilityEvent).toEqual({
            category: "Stage 1",
            dataIndex: 0,
            datum: { stage: "Stage 1", value: 100 },
            formattedCategory: "Stage 1",
            seriesId: funnelReg.id,
            seriesName: "Funnel",
            seriesType: "funnel",
            stageId: "i:0",
            visible: false
        });

        // Toggle back on
        funnelReg.toggleDatumVisibility?.("i:0");
        fixture.detectChanges();

        expect(funnelReg.isDatumVisible("i:0")).toBe(true);
        expect(fixture.componentInstance.lastVisibilityEvent?.visible).toBe(true);
    });
});
