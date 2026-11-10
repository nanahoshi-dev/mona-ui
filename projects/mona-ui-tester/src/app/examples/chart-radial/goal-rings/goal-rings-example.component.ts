import { Component, computed, signal } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    RadialBarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartRadialDatumVisibilityEvent, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-radial-goal-rings-example",
    imports: [ChartComponent, ChartLegendComponent, ChartTooltipComponent, RadialBarSeriesComponent],
    templateUrl: "./goal-rings-example.component.html"
})
export class ChartRadialGoalRingsExampleComponent {
    protected readonly goals = [
        { progress: 82, team: "Sales" },
        { progress: 64, team: "Support" },
        { progress: 91, team: "Product" },
        { progress: 47, team: "Marketing" }
    ];
    protected readonly hiddenSummary = computed(() => {
        const ids = this.hiddenTeams();
        return ids.length > 0 ? ids.join(", ") : "none";
    });
    protected readonly hiddenTeams = signal<readonly string[]>([]);
    protected readonly lastToggle = signal("Toggle a team in the legend.");

    protected onDatumVisibilityChange(event: ChartRadialDatumVisibilityEvent): void {
        this.lastToggle.set(`${String(event.category)} is now ${event.visible ? "shown" : "hidden"}.`);
    }

    protected readonly percent: ChartValueFormatter = value => `${String(value)}%`;
}
