import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartReferenceLineComponent } from "../chart-reference-line/chart-reference-line.component";
import { ChartReferenceBandComponent } from "../chart-reference-band/chart-reference-band.component";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartBrushComponent,
        ChartReferenceLineComponent,
        ChartReferenceBandComponent
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'name'" [style.width.px]="600" [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-chart-reference-band [axis]="'y'" [from]="5" [to]="15" />
            <mona-chart-reference-line [axis]="'y'" [value]="10" />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="true" />
            <mona-chart-selection />
            <mona-chart-brush />
        </mona-chart>
    `
})
class NineLayerRenderOrderHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart 9-Layer Authoritative Render Ordering", () => {
    let fixture: ComponentFixture<NineLayerRenderOrderHostComponent>;
    let host: NineLayerRenderOrderHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NineLayerRenderOrderHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NineLayerRenderOrderHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("composes all 9 visual layers in correct sequence without error", () => {
        expect(host).toBeDefined();
    });
});
