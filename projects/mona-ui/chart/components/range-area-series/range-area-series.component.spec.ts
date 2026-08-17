import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartCurve } from "../../models/chart-series.models";
import type { ChartField } from "../../models/chart.models";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaRangeAreaSeriesComponent } from "./range-area-series.component";

@Component({
    imports: [MonaChartComponent, MonaRangeAreaSeriesComponent],
    template: `
        <mona-chart [data]="data()">
            <mona-range-area-series
                [fromField]="fromField()"
                [toField]="toField()"
                [xField]="xField()"
                [name]="name()"
                [color]="color()"
                [curve]="curve()"
                [connectNulls]="connectNulls()"
                [showPoints]="showPoints()"
                [pointRadius]="pointRadius()"
                [strokeWidth]="strokeWidth()"
                [fillOpacity]="fillOpacity()"
                [(visible)]="visible" />
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly color = signal("#ec4899");
    public readonly connectNulls = signal(false);
    public readonly curve = signal<ChartCurve>("monotone-x");
    public readonly data = signal<readonly unknown[]>([
        { max: 50, min: 20, time: new Date("2026-01-01") },
        { max: 65, min: 30, time: new Date("2026-01-02") },
        { max: 80, min: 45, time: new Date("2026-01-03") }
    ]);
    public readonly fillOpacity = signal<number | undefined>(undefined);
    public readonly fromField = signal<ChartField>("min");
    public readonly name = signal("Confidence Band");
    public readonly pointRadius = signal<number | undefined>(5);
    public readonly showPoints = signal(true);
    public readonly strokeWidth = signal<number | undefined>(3);
    public readonly toField = signal<ChartField>("max");
    public readonly visible = signal(true);
    public readonly xField = signal<ChartField | undefined>("time");
}

describe("MonaRangeAreaSeriesComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let seriesComponent: MonaRangeAreaSeriesComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        seriesComponent = fixture.debugElement.query(By.directive(MonaRangeAreaSeriesComponent)).componentInstance;
    });

    it("should create component and bind inputs", () => {
        expect(seriesComponent).toBeDefined();
        expect(seriesComponent.name()).toBe("Confidence Band");
        expect(seriesComponent.fromField()).toBe("min");
        expect(seriesComponent.toField()).toBe("max");
        expect(seriesComponent.curve()).toBe("monotone-x");
        expect(seriesComponent.showPoints()).toBe(true);
        expect(seriesComponent.visible()).toBe(true);
    });

    it("should update two-way visible model", () => {
        host.visible.set(false);
        fixture.detectChanges();
        expect(seriesComponent.visible()).toBe(false);

        seriesComponent.visible.set(true);
        fixture.detectChanges();
        expect(host.visible()).toBe(true);
    });
});
