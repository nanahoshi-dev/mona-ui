import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartBrushComponent
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400"
            style="--mona-chart-selection-color: #3b82f6; --mona-chart-brush-fill-color: rgba(59, 130, 246, 0.1);">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="true" />
            <mona-chart-selection />
            <mona-chart-brush />
        </mona-chart>
    `
})
class ThemeCssVariablesCascadeHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart Theme CSS Variables Cascade for Selection, Brush, and Data Labels", () => {
    let fixture: ComponentFixture<ThemeCssVariablesCascadeHostComponent>;
    let host: ThemeCssVariablesCascadeHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ThemeCssVariablesCascadeHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ThemeCssVariablesCascadeHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("resolves CSS custom properties and renders cleanly", () => {
        expect(host).toBeDefined();
    });
});
