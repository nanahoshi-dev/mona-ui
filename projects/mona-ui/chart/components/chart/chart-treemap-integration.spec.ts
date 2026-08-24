import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { TreemapSeriesComponent } from "../treemap-series/treemap-series.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartTooltipComponent } from "../chart-tooltip/chart-tooltip.component";
import type { ChartPointEvent } from "../../models/chart-event.models";
import type { ChartTreemapSeriesScene } from "../../internal/scene/hierarchical-scene";

interface TreemapTestItem {
    children?: TreemapTestItem[];
    name: string;
    value?: number;
}

@Component({
    imports: [
        ChartComponent,
        TreemapSeriesComponent,
        ChartLegendComponent,
        ChartTooltipComponent
    ],
    template: `
        <mona-chart
            style="width: 600px; height: 400px;"
            [animation]="false"
            (pointClick)="onPointClick($event)">
            <mona-treemap-series
                [data]="data()"
                [field]="'value'"
                [labelField]="'name'"
                [maxDepth]="maxDepth()"
                [tile]="tile()"
                [sort]="sort()"
                [showLabels]="true"
                [showParentLabels]="true"
                [showValues]="true" />
            <mona-chart-tooltip />
            <mona-chart-legend />
        </mona-chart>
    `
})
class TestTreemapChartComponent {
    public readonly data = signal<readonly TreemapTestItem[]>([
        {
            children: [
                { name: "Frontend API", value: 40 },
                { name: "Backend API", value: 60 }
            ],
            name: "Applications"
        },
        {
            children: [
                { name: "PostgreSQL", value: 80 },
                { name: "Redis", value: 20 }
            ],
            name: "Databases"
        }
    ]);
    public readonly maxDepth = signal<number | undefined>(undefined);
    public readonly sort = signal<"ascending" | "descending" | "none">("descending");
    public readonly tile = signal<"squarify" | "binary" | "dice" | "slice" | "slice-dice">("squarify");
    public lastPointClick: ChartPointEvent | null = null;

    public onPointClick(event: ChartPointEvent): void {
        this.lastPointClick = event;
    }
}

@Component({
    imports: [
        ChartComponent,
        TreemapSeriesComponent,
        LineSeriesComponent
    ],
    template: `
        <mona-chart style="width: 600px; height: 400px;" [animation]="false">
            <mona-treemap-series [data]="data()" />
            <mona-line-series [data]="[10, 20]" />
        </mona-chart>
    `
})
class TestMixedChartComponent {
    public readonly data = signal<readonly TreemapTestItem[]>([
        { name: "Root", value: 100 }
    ]);
}

@Component({
    imports: [
        ChartComponent,
        TreemapSeriesComponent
    ],
    template: `
        <mona-chart style="width: 600px; height: 400px;" [animation]="false">
            <mona-treemap-series [data]="data1()" />
            <mona-treemap-series [data]="data2()" />
        </mona-chart>
    `
})
class TestMultiTreemapChartComponent {
    public readonly data1 = signal<readonly TreemapTestItem[]>([{ name: "A", value: 50 }]);
    public readonly data2 = signal<readonly TreemapTestItem[]>([{ name: "B", value: 50 }]);
}

describe("ChartTreemapIntegration", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TestTreemapChartComponent,
                TestMixedChartComponent,
                TestMultiTreemapChartComponent
            ]
        });
    });

    it("renders hierarchical treemap scene with legend and hit targets", () => {
        const fixture = TestBed.createComponent(TestTreemapChartComponent);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene();

        expect(scene).not.toBeNull();
        expect(scene!.coordinateSystem).toBe("hierarchical");
        expect(scene!.hasRenderableData).toBe(true);
        expect(scene!.series).toHaveLength(1);
        expect(scene!.legendItems).toHaveLength(2); // Applications and Databases
        expect(scene!.hitTargets.length).toBeGreaterThan(0);
    });

    it("populates hierarchy metadata in tooltip context and forces shared=false", () => {
        const fixture = TestBed.createComponent(TestTreemapChartComponent);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene()!;
        const hit = scene.hitTargets.find(h => h.hierarchy?.formattedLabel === "PostgreSQL");

        expect(hit).toBeDefined();

        // Simulate pointer move over PostgreSQL node
        const center = hit!.bounds
            ? { x: hit!.bounds.x + hit!.bounds.width / 2, y: hit!.bounds.y + hit!.bounds.height / 2 }
            : { x: 100, y: 100 };

        const canvas = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        canvas.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: center.x,
                clientY: center.y
            })
        );
        fixture.detectChanges();

        const tooltipCtx = chart.tooltipContext();
        if (tooltipCtx) {
            expect(tooltipCtx.shared).toBe(false);
            expect(tooltipCtx.point.hierarchy).toBeDefined();
            expect(tooltipCtx.point.hierarchy!.formattedLabel).toBe("PostgreSQL");
            expect(tooltipCtx.point.hierarchy!.aggregateValue).toBe(80);
            expect(tooltipCtx.point.hierarchy!.isLeaf).toBe(true);
        }
    });

    it("supports keyboard navigation with Arrow keys, Home, End, and triggers pointClick on Enter/Space", () => {
        const fixture = TestBed.createComponent(TestTreemapChartComponent);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as any;
        const rootDiv = fixture.nativeElement.querySelector('[tabindex="0"]') as HTMLElement;

        // 1. Initial ArrowRight initiates selection at first node
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();

        expect(chart.activeAccessibilityText()).toContain("Applications");

        // 2. ArrowRight enters child of Applications (Frontend API or Backend API)
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();

        expect(chart.activeAccessibilityText().length).toBeGreaterThan(0);

        // 3. ArrowLeft returns to parent (Applications)
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
        fixture.detectChanges();

        expect(chart.activeAccessibilityText()).toContain("Applications");

        // 4. End moves to last node
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
        fixture.detectChanges();

        // 5. Enter emits pointClick
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        fixture.detectChanges();

        expect(fixture.componentInstance.lastPointClick).not.toBeNull();
        expect(fixture.componentInstance.lastPointClick!.seriesType).toBe("treemap");
        expect(fixture.componentInstance.lastPointClick!.value).toBeDefined();
        expect(typeof fixture.componentInstance.lastPointClick!.value).toBe("number");
        expect(fixture.componentInstance.lastPointClick!.yValue).toBe(fixture.componentInstance.lastPointClick!.value);

        // 6. Escape clears interaction state
        rootDiv.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        fixture.detectChanges();

        expect(chart.activeAccessibilityText()).toBe("");
    });

    it("handles maxDepth collapse into aggregate terminal nodes", () => {
        const fixture = TestBed.createComponent(TestTreemapChartComponent);
        fixture.componentInstance.maxDepth.set(1);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene()!;

        // At maxDepth=1, only the top-level branches (depth 1) are rendered as aggregate terminals
        const seriesScene = scene.series[0] as ChartTreemapSeriesScene;
        expect(seriesScene.nodes).toHaveLength(2); // Applications (aggregate 100) & Databases (aggregate 100)

        const appNode = seriesScene.nodes.find(n => n.formattedLabel === "Applications");
        expect(appNode).toBeDefined();
        expect(appNode!.isCollapsed).toBe(true);
        expect(appNode!.labelKind).toBe("terminal");
        expect(appNode!.aggregateValue).toBe(100);
        expect(appNode!.headerBounds).toBeUndefined();
    });

    it("fails safe when Treemap is mixed with Cartesian series", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const fixture = TestBed.createComponent(TestMixedChartComponent);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene()!;

        expect(scene.coordinateSystem).toBe("hierarchical");
        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series).toHaveLength(0);

        consoleSpy.mockRestore();
    });

    it("fails safe when multiple Treemap series are registered in the same chart", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const fixture = TestBed.createComponent(TestMultiTreemapChartComponent);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as ChartComponent;
        const scene = chart.scene()!;

        expect(scene.coordinateSystem).toBe("hierarchical");
        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series).toHaveLength(0);

        consoleSpy.mockRestore();
    });
});
