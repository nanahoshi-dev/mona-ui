import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { FunnelSeriesComponent } from "../funnel-series/funnel-series.component";
import { ChartComponent } from "./chart.component";
import { ChartFunnelLabelTemplateDirective } from "../../directives/chart-funnel-label-template.directive";
import type { CartesianFunnelChartScene } from "../../internal/scene/funnel-scene";

@Component({
    imports: [ChartComponent, FunnelSeriesComponent, ChartFunnelLabelTemplateDirective],
    template: `
        <mona-chart [style.width.px]="500" [style.height.px]="400">
            <mona-funnel-series
                [data]="data()"
                [field]="'value'"
                [categoryField]="'stage'"
                [orientation]="orientation()"
                [showLabels]="true">
                <ng-template monaChartFunnelLabelTemplate let-stage>
                    <span class="custom-funnel-label">{{ stage.category }}: {{ stage.value }} ({{ stage.formattedOverallConversionRate }})</span>
                </ng-template>
            </mona-funnel-series>
        </mona-chart>
    `
})
class TestFunnelIntegrationComponent {
    public readonly data = signal<readonly unknown[]>([
        { stage: "Impressions", value: 1000 },
        { stage: "Clicks", value: 400 },
        { stage: "Signups", value: 100 },
        { stage: "Purchases", value: 20 }
    ]);
    public readonly orientation = signal<"vertical" | "horizontal">("vertical");
}

describe("ChartComponent Funnel Integration", () => {
    it("renders funnel chart scene with stages and conversion rates", () => {
        TestBed.configureTestingModule({
            imports: [TestFunnelIntegrationComponent]
        });

        const fixture = TestBed.createComponent(TestFunnelIntegrationComponent);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chartComp.scene() as CartesianFunnelChartScene;

        expect(scene).not.toBeNull();
        expect(scene.cartesianKind).toBe("funnel");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const stages = scene.series[0].stages;
        expect(stages.length).toBe(4);
        expect(stages[0].category).toBe("Impressions");
        expect(stages[0].conversionRate).toBeUndefined();
        expect(stages[0].overallConversionRate).toBe(1);
        expect(stages[1].conversionRate).toBe(0.4);
        expect(stages[2].conversionRate).toBe(0.25);
        expect(stages[3].conversionRate).toBe(0.2);

        // Custom DOM label template rendered
        const customLabels = fixture.nativeElement.querySelectorAll(".custom-funnel-label");
        expect(customLabels.length).toBe(4);
        expect(customLabels[0].textContent).toContain("Impressions: 1000 (100%)");
        expect(customLabels[1].textContent).toContain("Clicks: 400 (40%)");
    });

    it("renders default funnel DOM labels with configurable labelContent", () => {
        @Component({
            imports: [ChartComponent, FunnelSeriesComponent],
            template: `
                <mona-chart [style.width.px]="500" [style.height.px]="400">
                    <mona-funnel-series
                        [data]="data"
                        [field]="'value'"
                        [categoryField]="'stage'"
                        [labelContent]="labelContent()"
                        [showLabels]="true" />
                </mona-chart>
            `
        })
        class DefaultFunnelTestComponent {
            public readonly data = [
                { stage: "Stage A", value: 100 },
                { stage: "Stage B", value: 50 }
            ];
            public readonly labelContent = signal<"category" | "value" | "category-value" | "category-value-conversion">("category-value");
        }

        TestBed.configureTestingModule({
            imports: [DefaultFunnelTestComponent]
        });

        const fixture = TestBed.createComponent(DefaultFunnelTestComponent);
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll(".truncate");
        expect(labels.length).toBe(2);
        expect(labels[0].textContent?.trim()).toBe("Stage A 100");
        expect(labels[1].textContent?.trim()).toBe("Stage B 50");

        // Change labelContent to category-value-conversion
        fixture.componentInstance.labelContent.set("category-value-conversion");
        fixture.detectChanges();

        const updatedLabels = fixture.nativeElement.querySelectorAll(".truncate");
        expect(updatedLabels[1].textContent?.trim()).toBe("Stage B 50 (50%)");
    });
});
