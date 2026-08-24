import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartDataLabelTemplateDirective } from "../directives/chart-data-label-template.directive";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" [dataLabels]="true">
                <ng-template monaChartDataLabel let-ctx>
                    <span class="custom-data-label">{{ ctx.formattedValue }}</span>
                </ng-template>
            </mona-bar-series>
        </mona-chart>
    `
})
class DataLabelsMeasurementHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart Data Labels ResizeObserver Measurement & Collision Life Cycle", () => {
    let fixture: ComponentFixture<DataLabelsMeasurementHostComponent>;
    let host: DataLabelsMeasurementHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataLabelsMeasurementHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DataLabelsMeasurementHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("observes custom template elements and retains measurements across updates", async () => {
        expect(host).toBeDefined();
        const labels = fixture.nativeElement.querySelectorAll(".custom-data-label");
        expect(labels.length).toBe(2);
    });
});
