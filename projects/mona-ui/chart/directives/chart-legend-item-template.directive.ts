import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartLegendItemTemplateContext } from "../models/chart-series.models";

@Directive({
    selector: "ng-template[monaChartLegendItemTemplate]"
})
export class ChartLegendItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartLegendItemTemplateContext>>(TemplateRef);
}
