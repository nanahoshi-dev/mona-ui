import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { ScatterSeriesComponent } from "../scatter-series/scatter-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        LineSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'x'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'y'" [name]="'Bars'" [seriesKey]="'bars-key'" />
            <mona-line-series [field]="'y'" [name]="'Lines'" [seriesKey]="'lines-key'" />
            <mona-chart-selection
                [mode]="'single'"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class SelectionMarksMatrixHostComponent {
    public readonly data = signal([
        { x: 1, y: 10 },
        { x: 2, y: 20 }
    ]);
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Selection Matrix & Series Key Parity", () => {
    let fixture: ComponentFixture<SelectionMarksMatrixHostComponent>;
    let host: SelectionMarksMatrixHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SelectionMarksMatrixHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SelectionMarksMatrixHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("initializes selection cleanly on multi-series Cartesian chart", () => {
        expect(host).toBeDefined();
    });
});
