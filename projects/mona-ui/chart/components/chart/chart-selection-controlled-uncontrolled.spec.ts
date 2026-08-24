import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-selection
                [mode]="mode()"
                [selectedMarkIds]="controlledIds()"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class ControlledUncontrolledHostComponent {
    public readonly controlledIds = signal<string[] | undefined>(undefined);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public readonly mode = signal<"single" | "multiple">("multiple");
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Selection Controlled / Uncontrolled Lifecycle Transitions", () => {
    let fixture: ComponentFixture<ControlledUncontrolledHostComponent>;
    let host: ControlledUncontrolledHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ControlledUncontrolledHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ControlledUncontrolledHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("seeds uncontrolled selection when controlled selectedMarkIds transitions to undefined", async () => {
        // Set controlled selection
        host.controlledIds.set(["mark-1", "mark-2"]);
        fixture.detectChanges();
        await fixture.whenStable();

        // Switch to uncontrolled
        host.controlledIds.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.controlledIds()).toBeUndefined();
    });

    it("prunes selection when mode switches from multiple to single in uncontrolled mode", async () => {
        host.mode.set("multiple");
        fixture.detectChanges();
        await fixture.whenStable();

        // Switch to single mode
        host.mode.set("single");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.mode()).toBe("single");
    });
});
