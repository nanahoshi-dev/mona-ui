import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartCenterTemplateDirective,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    DonutSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

const euros = new Intl.NumberFormat("en", { currency: "EUR", maximumFractionDigits: 0, style: "currency" });

@Component({
    selector: "app-chart-pie-hidden-slices-example",
    imports: [
        ButtonDirective,
        ChartCenterTemplateDirective,
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        DonutSeriesComponent
    ],
    templateUrl: "./hidden-slices-example.component.html"
})
export class ChartPieHiddenSlicesExampleComponent {
    protected readonly hidden = signal<readonly number[]>([3]);
    protected readonly regions = [
        { region: "Europe", revenue: 412000 },
        { region: "North America", revenue: 356000 },
        { region: "Asia Pacific", revenue: 228000 },
        { region: "Latin America", revenue: 94000 },
        { region: "Middle East & Africa", revenue: 61000 }
    ];
    protected readonly currency: ChartValueFormatter = value => euros.format(Number(value));

    protected isShown(index: number): boolean {
        return !this.hidden().includes(index);
    }

    protected setShown(index: number, shown: boolean): void {
        this.hidden.update(hidden => (shown ? hidden.filter(other => other !== index) : [...hidden, index]));
    }
}
