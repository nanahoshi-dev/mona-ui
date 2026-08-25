import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartTitleTemplateContext } from "../models/chart-axis.models";

@Directive({
    selector: "ng-template[monaChartTitleTemplate]"
})
export class ChartTitleTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartTitleTemplateContext>>(TemplateRef);
}
