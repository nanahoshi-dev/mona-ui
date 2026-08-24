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
                [clearOnBackgroundClick]="clearOnBgClick()"
                [retainOnDataChange]="retainData()"
                [defaultSelectedMarkIds]="['first-mark']"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class SelectionLifecycleDataChangeHostComponent {
    public readonly clearOnBgClick = signal(true);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public readonly retainData = signal(false);
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Selection Lifecycle & retainOnDataChange", () => {
    let fixture: ComponentFixture<SelectionLifecycleDataChangeHostComponent>;
    let host: SelectionLifecycleDataChangeHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SelectionLifecycleDataChangeHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SelectionLifecycleDataChangeHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("clears selection when data changes and retainOnDataChange is false", async () => {
        // Change dataset
        host.data.set([
            { name: "C", value: 30 },
            { name: "D", value: 40 }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.data().length).toBe(2);
    });
});
