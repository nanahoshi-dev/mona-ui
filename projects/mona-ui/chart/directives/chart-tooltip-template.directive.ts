import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartTooltipTemplateContext } from "../models/chart-tooltip.models";

@Directive({
    selector: "ng-template[monaChartTooltipTemplate]"
})
export class ChartTooltipTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartTooltipTemplateContext>>(TemplateRef);
}
