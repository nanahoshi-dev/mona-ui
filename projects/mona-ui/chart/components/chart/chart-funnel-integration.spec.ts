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
                [minLabelWidth]="0"
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

    it("forwards stage fillColor as color and readable label foreground as textColor in custom label template (FWF-C1)", () => {
        @Component({
            imports: [ChartComponent, FunnelSeriesComponent, ChartFunnelLabelTemplateDirective],
            template: `
                <mona-chart [style.width.px]="500" [style.height.px]="400">
                    <mona-funnel-series
                        [data]="data"
                        [field]="'value'"
                        [categoryField]="'stage'"
                        [colorField]="'color'"
                        [minLabelWidth]="0"
                        [showLabels]="true">
                        <ng-template monaChartFunnelLabelTemplate let-stage>
                            <span class="color-test-label" [attr.data-fill]="stage.color" [attr.data-text]="stage.textColor">
                                {{ stage.category }}
                            </span>
                        </ng-template>
                    </mona-funnel-series>
                </mona-chart>
            `
        })
        class CustomColorFunnelComponent {
            public readonly data = [
                { color: "#000000", stage: "Dark", value: 100 },
                { color: "#ffffff", stage: "Light", value: 60 }
            ];
        }

        TestBed.configureTestingModule({
            imports: [CustomColorFunnelComponent]
        });

        const fixture = TestBed.createComponent(CustomColorFunnelComponent);
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll(".color-test-label");
        expect(labels.length).toBe(2);

        // Dark stage: color is stage fill #000000, textColor is light readable foreground (#ffffff)
        expect(labels[0].getAttribute("data-fill")).toBe("#000000");
        expect(labels[0].getAttribute("data-text")).toBe("#ffffff");

        // Light stage: color is stage fill #ffffff, textColor is dark readable foreground
        expect(labels[1].getAttribute("data-fill")).toBe("#ffffff");
        expect(labels[1].getAttribute("data-text")).not.toBe("#ffffff");
    });

    it("announces visible stage position, overall conversion, and positive-only drop-off in live region (FWF-C6, FWF-C7)", () => {
        @Component({
            imports: [ChartComponent, FunnelSeriesComponent],
            template: `
                <mona-chart [animation]="false" [style.width.px]="500" [style.height.px]="400">
                    <mona-funnel-series
                        [data]="data"
                        [field]="'value'"
                        [categoryField]="'stage'"
                        [name]="'Pipeline'" />
                </mona-chart>
            `
        })
        class AccessibilityFunnelComponent {
            public readonly data = [
                { stage: "Visits", value: 2000 },
                { stage: "Qualified", value: 400 },
                { stage: "Expanding", value: 600 } // Widening stage (>100% conversion, negative drop-off suppressed)
            ];
        }

        TestBed.configureTestingModule({
            imports: [AccessibilityFunnelComponent]
        });

        const fixture = TestBed.createComponent(AccessibilityFunnelComponent);
        fixture.detectChanges();

        const chartComp = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chartComp.scene() as CartesianFunnelChartScene;
        expect(scene.hitTargets.length).toBe(3);

        const rootDiv = fixture.nativeElement.querySelector('[tabindex="0"]') as HTMLElement;
        const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;

        // Keydown 1: Select stage 1 (overall 100%, no previous-stage conversion)
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
        fixture.detectChanges();
        expect(liveRegion.textContent?.trim()).toBe(
            "Pipeline, Visits, stage 1 of 3: 2000. Overall conversion 100%."
        );

        // Keydown 2: Qualified (400 / 2000 = 20% overall, 20% conversion, drop-off 1600)
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
        fixture.detectChanges();
        expect(liveRegion.textContent?.trim()).toBe(
            "Pipeline, Qualified, stage 2 of 3: 400. Conversion 20% of previous stage. Overall conversion 20%. Drop-off 1600."
        );

        // Keydown 3: Widening stage (600 > 400 -> conversion 150%, overall 30%, NO negative drop-off)
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
        fixture.detectChanges();
        expect(liveRegion.textContent?.trim()).toBe(
            "Pipeline, Expanding, stage 3 of 3: 600. Conversion 150% of previous stage. Overall conversion 30%."
        );
    });
});
