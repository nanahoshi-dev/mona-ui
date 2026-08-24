import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import type { ChartSelectionChangeEvent, ChartSelectionMode } from "../../models/chart-selection.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent
    ],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-selection
                [mode]="mode()"
                [selectedMarkIds]="selectedMarkIds()"
                [retainOnDataChange]="retainOnDataChange()"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class SelectionControlledHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public readonly mode = signal<ChartSelectionMode>("single");
    public readonly selectedMarkIds = signal<readonly string[] | undefined>(undefined);
    public readonly retainOnDataChange = signal(true);
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Controlled Selection", () => {
    let fixture: ComponentFixture<SelectionControlledHostComponent>;
    let host: SelectionControlledHostComponent;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => {}
        });

        await TestBed.configureTestingModule({
            imports: [SelectionControlledHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SelectionControlledHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("normalizes multi-element controlled selectedMarkIds to the first element when mode is single and logs warning", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        host.mode.set("single");
        // Pass 3 IDs to single mode
        host.selectedMarkIds.set(["bar:0:0", "bar:0:1", "bar:0:2"]);
        fixture.detectChanges();

        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain("received 3 selectedMarkIds. Only the first ID will be selected");

        // Internal effective selection should have length 1
        const effective = (host.chart() as any).effectiveSelectedMarkIds();
        expect(effective).toEqual(["bar:0:0"]);

        warnSpy.mockRestore();
    });

    it("emits proposal selectionChange event when retainOnDataChange is false for controlled selection", () => {
        host.selectedMarkIds.set(["bar:0:0", "bar:0:1"]);
        host.mode.set("multiple");
        host.retainOnDataChange.set(false);
        fixture.detectChanges();

        expect(host.selectionEvents.length).toBe(0);

        // Update data
        host.data.set([
            { name: "D", value: 40 },
            { name: "E", value: 50 }
        ]);
        fixture.detectChanges();

        // Should emit a programmatic proposal event indicating removal of the old selected IDs
        expect(host.selectionEvents.length).toBe(1);
        expect(host.selectionEvents[0].source).toBe("programmatic");
        expect(host.selectionEvents[0].selectedMarkIds).toEqual([]);
        expect(host.selectionEvents[0].removedMarkIds).toEqual(["bar:0:0", "bar:0:1"]);
    });

    it("emits proposal describing effective single-selection rather than raw controlled IDs", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        host.mode.set("single");
        // Supply 3 raw IDs to single mode
        host.selectedMarkIds.set(["bar:0:0", "bar:0:1", "bar:0:2"]);
        host.retainOnDataChange.set(false);
        fixture.detectChanges();

        // Effective selection before data change is only ["bar:0:0"]
        const effectiveBefore = (host.chart() as any).effectiveSelectedMarkIds();
        expect(effectiveBefore).toEqual(["bar:0:0"]);

        // Mutate chart data
        host.data.set([
            { name: "D", value: 40 },
            { name: "E", value: 50 }
        ]);
        fixture.detectChanges();

        // Emitted proposal event must reflect effective selection ["bar:0:0"], NOT raw ["bar:0:0", "bar:0:1", "bar:0:2"]
        expect(host.selectionEvents.length).toBe(1);
        const evt = host.selectionEvents[0];
        expect(evt.source).toBe("programmatic");
        expect(evt.previousSelectedMarkIds).toEqual(["bar:0:0"]);
        expect(evt.removedMarkIds).toEqual(["bar:0:0"]);
        expect(evt.selectedMarkIds).toEqual([]);
        expect(evt.addedMarkIds).toEqual([]);

        // If parent does not adopt (controlled input remains unchanged), effective selection remains ["bar:0:0"]
        const effectiveAfterRejection = (host.chart() as any).effectiveSelectedMarkIds();
        expect(effectiveAfterRejection).toEqual(["bar:0:0"]);

        // If parent adopts the proposal
        host.selectedMarkIds.set([]);
        fixture.detectChanges();
        const effectiveAfterAdoption = (host.chart() as any).effectiveSelectedMarkIds();
        expect(effectiveAfterAdoption).toEqual([]);

        warnSpy.mockRestore();
    });
});
