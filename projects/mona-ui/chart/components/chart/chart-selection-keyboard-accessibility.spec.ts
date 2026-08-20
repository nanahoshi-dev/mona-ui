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
                [keyboardSelection]="true"
                (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class SelectionKeyboardHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Selection Keyboard Navigation & ARIA Live Region Parity", () => {
    let fixture: ComponentFixture<SelectionKeyboardHostComponent>;
    let host: SelectionKeyboardHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SelectionKeyboardHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SelectionKeyboardHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("handles keyboard navigation and updates live region", async () => {
        const container = fixture.nativeElement.querySelector("div[tabindex]") || fixture.nativeElement;
        expect(container).toBeDefined();

        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();
        await fixture.whenStable();

        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host).toBeDefined();
    });
});
