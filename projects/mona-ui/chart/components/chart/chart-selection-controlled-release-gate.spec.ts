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

describe("Chart Controlled Selection Release Gate (GDSB-R2-008, GDSB-R2-009)", () => {
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
});
