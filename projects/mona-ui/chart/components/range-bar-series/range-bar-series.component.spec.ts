import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartField } from "../../models/chart.models";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaRangeBarSeriesComponent } from "./range-bar-series.component";

@Component({
    imports: [MonaChartComponent, MonaRangeBarSeriesComponent],
    template: `
        <mona-chart [data]="data()">
            <mona-range-bar-series
                [fromField]="fromField()"
                [toField]="toField()"
                [xField]="xField()"
                [name]="name()"
                [color]="color()"
                [borderRadius]="borderRadius()"
                [maxBarWidth]="maxBarWidth()"
                [fillOpacity]="fillOpacity()"
                [(visible)]="visible" />
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly borderRadius = signal<number | undefined>(undefined);
    public readonly color = signal("#8b5cf6");
    public readonly data = signal<readonly unknown[]>([
        { max: 28, min: 14, month: "Jan" },
        { max: 32, min: 18, month: "Feb" },
        { max: 38, min: 22, month: "Mar" }
    ]);
    public readonly fillOpacity = signal<number | undefined>(undefined);
    public readonly fromField = signal<ChartField>("min");
    public readonly maxBarWidth = signal<number | undefined>(undefined);
    public readonly name = signal("Temperature Range");
    public readonly toField = signal<ChartField>("max");
    public readonly visible = signal(true);
    public readonly xField = signal<ChartField | undefined>("month");
}

describe("MonaRangeBarSeriesComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let seriesComponent: MonaRangeBarSeriesComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        seriesComponent = fixture.debugElement.query(By.directive(MonaRangeBarSeriesComponent)).componentInstance;
    });

    it("should create component and bind inputs", () => {
        expect(seriesComponent).toBeDefined();
        expect(seriesComponent.name()).toBe("Temperature Range");
        expect(seriesComponent.fromField()).toBe("min");
        expect(seriesComponent.toField()).toBe("max");
        expect(seriesComponent.xField()).toBe("month");
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
