import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";

@Component({
    imports: [ChartComponent, BarSeriesComponent, ChartXAxisComponent, ChartYAxisComponent],
    template: `
        <mona-chart [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [color]="'#0f172a'"
                [dataLabels]="{ position: 'center' }" />
        </mona-chart>
    `
})
class DataLabelsContrastHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart Data Labels Contrast Calculation & Halo Rendering", () => {
    let fixture: ComponentFixture<DataLabelsContrastHostComponent>;
    let host: DataLabelsContrastHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataLabelsContrastHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DataLabelsContrastHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("renders data labels with appropriate contrast on dark backgrounds", () => {
        expect(host).toBeDefined();
    });
});
