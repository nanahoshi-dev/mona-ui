import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { CandlestickSeriesComponent } from "../candlestick-series/candlestick-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { FinancialDataResolver } from "../../internal/data/financial-data-resolver";

@Component({
    imports: [
        ChartComponent,
        CandlestickSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'date'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-candlestick-series
                [seriesKey]="'stockA'"
                [openField]="'open'"
                [highField]="'high'"
                [lowField]="'low'"
                [closeField]="'close'"
                [name]="'Stock A'" />
            <mona-candlestick-series
                [seriesKey]="'stockB'"
                [openField]="'open'"
                [highField]="'high'"
                [lowField]="'low'"
                [closeField]="'close'"
                [name]="'Stock B'" />
        </mona-chart>
    `
})
class FinancialSeriesKeyHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { date: "2026-01-01", open: 100, high: 120, low: 90, close: 110 }
    ]);
}

describe("Financial Series Identity and seriesKey Normalization", () => {
    let fixture: ComponentFixture<FinancialSeriesKeyHostComponent>;
    let host: FinancialSeriesKeyHostComponent;

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
            imports: [FinancialSeriesKeyHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinancialSeriesKeyHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("resolves unique animation keys prefixed with normalized seriesKey for financial marks", () => {
        const rawData = [{ date: "2026-01-01", open: 100, high: 120, low: 90, close: 110 }];
        const resolvedA = FinancialDataResolver.resolve({
            data: rawData,
            closeField: "close",
            highField: "high",
            lowField: "low",
            openField: "open",
            seriesId: "finA",
            seriesKey: "stockA",
            seriesName: "Stock A",
            xField: "date"
        });

        const resolvedB = FinancialDataResolver.resolve({
            data: rawData,
            closeField: "close",
            highField: "high",
            lowField: "low",
            openField: "open",
            seriesId: "finB",
            seriesKey: "stockB",
            seriesName: "Stock B",
            xField: "date"
        });

        expect(resolvedA.marks.length).toBe(1);
        expect(resolvedB.marks.length).toBe(1);

        expect(resolvedA.marks[0].animationKey).toBe("stockA:fin:x:2026-01-01");
        expect(resolvedB.marks[0].animationKey).toBe("stockB:fin:x:2026-01-01");
    });
});
