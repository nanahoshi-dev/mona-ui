import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        LineSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="{ position: 'outside-end' }" />
            <mona-line-series
                [field]="'value'"
                [name]="'Lines'"
                [dataLabels]="true">
                <ng-template monaChartDataLabel let-ctx>
                    <span class="custom-label">{{ ctx.formattedValue }} units</span>
                </ng-template>
            </mona-line-series>
        </mona-chart>
    `
})
class DataLabelsRenderingHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart Data Labels Rendering Matrix & Custom Templates", () => {
    let fixture: ComponentFixture<DataLabelsRenderingHostComponent>;
    let host: DataLabelsRenderingHostComponent;

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
            imports: [DataLabelsRenderingHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DataLabelsRenderingHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("renders canvas and custom template data labels cleanly", async () => {
        expect(host).toBeDefined();

        const customLabels = fixture.nativeElement.querySelectorAll(".custom-label");
        expect(customLabels.length).toBeGreaterThan(0);
        expect(customLabels[0].textContent).toContain("10 units");
    });
});
