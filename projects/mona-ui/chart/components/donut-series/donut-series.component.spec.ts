import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartCenterTemplateDirective } from "../../directives/chart-center-template.directive";
import type { ChartPolarFillMode } from "../../models/chart-polar.models";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaDonutSeriesComponent } from "./donut-series.component";

@Component({
    imports: [MonaChartComponent, MonaDonutSeriesComponent, ChartCenterTemplateDirective],
    template: `
        <mona-chart [data]="data()">
            <mona-donut-series
                [field]="field()"
                [categoryField]="categoryField()"
                [fillMode]="fillMode()"
                [innerRadiusRatio]="innerRadiusRatio()">
                @if (useCustomCenter()) {
                    <ng-template monaChartCenterTemplate let-total let-formattedTotal="formattedTotal">
                        <div class="custom-center">
                            <span class="total-value">{{ formattedTotal }}</span>
                        </div>
                    </ng-template>
                }
            </mona-donut-series>
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly categoryField = signal("category");
    public readonly data = signal([
        { category: "Hardware", revenue: 500 },
        { category: "Software", revenue: 300 },
        { category: "Services", revenue: 200 }
    ]);
    public readonly field = signal("revenue");
    public readonly fillMode = signal<ChartPolarFillMode>("solid");
    public readonly innerRadiusRatio = signal(0.6);
    public readonly useCustomCenter = signal(true);
}

describe("MonaDonutSeriesComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should register donut series and compute innerRadius", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        const scene = chart.scene();

        expect(scene).not.toBeNull();
        expect(scene?.coordinateSystem).toBe("polar");
        expect(scene?.series.length).toBe(1);
        expect(scene?.series[0].type).toBe("donut");
        if (scene && scene.coordinateSystem === "polar") {
            expect(scene.series[0].innerRadius).toBeGreaterThan(0);
            expect(scene.series[0].total).toBe(1000);
        }
    });

    it("should render custom center template and update on slice visibility toggle", () => {
        const centerEl = fixture.nativeElement.querySelector(".custom-center");
        expect(centerEl).not.toBeNull();
        expect(centerEl.textContent).toContain("1,000");

        const donutDebugEl = fixture.debugElement.query(By.directive(MonaDonutSeriesComponent));
        const donutComponent = donutDebugEl?.componentInstance as MonaDonutSeriesComponent;

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;

        // Hide Services (200) -> total should be 800
        donutComponent.toggleSlice(2);
        chart.recomputeScene();
        fixture.detectChanges();

        expect(centerEl.textContent).toContain("800");
    });

    it("should support solid and gradient fillMode", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        let scene = chart.scene();

        if (scene && scene.coordinateSystem === "polar") {
            expect(scene.series[0].fillMode).toBe("solid");
        }

        host.fillMode.set("gradient");
        fixture.detectChanges();
        chart.recomputeScene();
        scene = chart.scene();

        if (scene && scene.coordinateSystem === "polar") {
            expect(scene.series[0].fillMode).toBe("gradient");
        }
    });
});
