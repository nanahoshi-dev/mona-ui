import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    FunnelSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartFunnelStageVisibilityEvent } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-funnel-stage-visibility-example",
    imports: [ButtonDirective, ChartComponent, ChartLegendComponent, ChartTooltipComponent, FunnelSeriesComponent],
    templateUrl: "./stage-visibility-example.component.html"
})
export class ChartFunnelStageVisibilityExampleComponent {
    protected readonly hidden = signal<readonly string[]>([]);
    protected readonly journey = [
        { id: "visited", stage: "Visited", users: 12400 },
        { id: "signed-up", stage: "Signed up", users: 4820 },
        { id: "trial", stage: "Started trial", users: 3150 },
        { id: "subscribed", stage: "Subscribed", users: 1120 },
        { id: "renewed", stage: "Renewed", users: 860 }
    ];
    protected readonly lastChange = signal("");

    protected onStageVisibilityChange(event: ChartFunnelStageVisibilityEvent): void {
        this.lastChange.set(`${event.formattedCategory} was ${event.visible ? "shown" : "hidden"} from the legend.`);
    }
}
