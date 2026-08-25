import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartAxisLabelTemplateContext } from "../models/chart-axis.models";

@Directive({
    selector: "ng-template[monaChartAxisLabelTemplate]"
})
export class ChartAxisLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartAxisLabelTemplateContext>>(TemplateRef);
}
