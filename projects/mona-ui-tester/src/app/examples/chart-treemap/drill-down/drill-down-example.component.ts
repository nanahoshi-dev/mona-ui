import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ChartComponent, ChartTooltipComponent, TreemapSeriesComponent } from "@nanahoshi/mona-ui/chart";
import type { ChartPointEvent } from "@nanahoshi/mona-ui/chart";

interface Region {
    readonly children: readonly { readonly name: string; readonly value: number }[];
    readonly name: string;
}

const REGIONS: readonly Region[] = [
    {
        name: "Europe",
        children: [
            { name: "Germany", value: 420 },
            { name: "France", value: 310 },
            { name: "Spain", value: 190 },
            { name: "Italy", value: 170 }
        ]
    },
    {
        name: "Americas",
        children: [
            { name: "United States", value: 880 },
            { name: "Canada", value: 210 },
            { name: "Brazil", value: 160 }
        ]
    },
    {
        name: "Asia Pacific",
        children: [
            { name: "Japan", value: 380 },
            { name: "Australia", value: 240 },
            { name: "Singapore", value: 120 }
        ]
    }
];

@Component({
    selector: "app-chart-treemap-drill-down-example",
    imports: [ButtonDirective, ChartComponent, ChartTooltipComponent, TreemapSeriesComponent],
    templateUrl: "./drill-down-example.component.html"
})
export class ChartTreemapDrillDownExampleComponent {
    protected readonly data = computed(() => this.region()?.children ?? REGIONS);
    protected readonly region = signal<Region | null>(null);

    protected onPointClick(event: ChartPointEvent): void {
        if (this.region()) {
            return;
        }
        // With maxDepth 1 each region is one rectangle, and the first index of its path is the region's.
        const index = event.hierarchy?.sourceIndexPath[0];
        const region = index === undefined ? undefined : REGIONS[index];
        if (region) {
            this.region.set(region);
        }
    }
}
