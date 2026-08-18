import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type {
    ChartRegistrationContext,
    ChartSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type {
    ChartTreemapNodeVisibilityEvent,
    ChartTreemapSort,
    ChartTreemapTile
} from "../../models/chart-treemap.models";
import { TreemapSeriesComponent } from "./treemap-series.component";

@Component({
    imports: [TreemapSeriesComponent],
    template: `
        <mona-treemap-series
            [data]="data()"
            [field]="field()"
            [labelField]="labelField()"
            [childrenField]="childrenField()"
            [tile]="tile()"
            [sort]="sort()"
            [(visible)]="visible"
            (nodeVisibilityChange)="onNodeVisibilityChange($event)" />
    `
})
class TestTreemapHostComponent {
    public readonly data = signal<readonly unknown[]>([
        {
            children: [
                { name: "Alpha", value: 100 },
                { name: "Beta", value: 200 }
            ],
            name: "Branch 1"
        }
    ]);
    public readonly field = signal("value");
    public readonly labelField = signal("name");
    public readonly childrenField = signal("children");
    public readonly tile = signal<ChartTreemapTile>("squarify");
    public readonly sort = signal<ChartTreemapSort>("descending");
    public readonly visible = signal(true);

    public lastVisibilityEvent: ChartTreemapNodeVisibilityEvent | null = null;

    public onNodeVisibilityChange(event: ChartTreemapNodeVisibilityEvent): void {
        this.lastVisibilityEvent = event;
    }
}

describe("TreemapSeriesComponent", () => {
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
            imports: [TestTreemapHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestTreemapHostComponent);
        fixture.detectChanges();

        expect(registeredSeries.length).toBe(1);
        expect(registeredSeries[0].type).toBe("treemap");
        expect(registeredSeries[0].name()).toBe("Treemap");

        fixture.destroy();
        expect(registeredSeries.length).toBe(0);
    });

    it("supports toggling node visibility and emitting nodeVisibilityChange with full metadata", () => {
        TestBed.configureTestingModule({
            imports: [TestTreemapHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        });

        const fixture = TestBed.createComponent(TestTreemapHostComponent);
        fixture.detectChanges();

        const seriesReg = registeredSeries[0];
        if (seriesReg.type === "treemap") {
            const nodeId = "root/l:s:Branch 1";
            expect(seriesReg.isDatumVisible(nodeId)).toBe(true);
            const isNowVisible = seriesReg.toggleDatumVisibility(nodeId);
            expect(isNowVisible).toBe(false);
            expect(seriesReg.isDatumVisible(nodeId)).toBe(false);

            fixture.detectChanges();
            expect(fixture.componentInstance.lastVisibilityEvent).toEqual(
                expect.objectContaining({
                    dataIndex: 0,
                    depth: 1,
                    formattedLabel: "Branch 1",
                    label: "Branch 1",
                    nodeId,
                    seriesType: "treemap",
                    visible: false
                })
            );
        }
    });
});
