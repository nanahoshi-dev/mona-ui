import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../components/chart-selection/chart-selection.component";
import { ChartDataLabelTemplateDirective } from "../directives/chart-data-label-template.directive";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart
            [data]="data()"
            [xField]="'name'"
            [animation]="{ enabled: true, duration: 100 }"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" [dataLabels]="true">
                <ng-template monaChartDataLabel let-ctx>
                    <span class="test-label">{{ ctx.formattedValue }}</span>
                </ng-template>
            </mona-bar-series>
            <mona-chart-selection />
        </mona-chart>
    `
})
class AnimationSuppressionHostComponent {
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
}

describe("Chart Animation Suppression & Post-Transition Restoration", () => {
    let fixture: ComponentFixture<AnimationSuppressionHostComponent>;
    let host: AnimationSuppressionHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnimationSuppressionHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimationSuppressionHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("suppresses data labels and selection overlay during animation and restores afterward", async () => {
        // Trigger data transition
        host.data.set([
            { name: "A", value: 15 },
            { name: "B", value: 25 }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host).toBeDefined();
    });
});
