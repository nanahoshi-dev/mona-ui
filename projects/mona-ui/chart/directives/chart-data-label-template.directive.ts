import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartDataLabelContext } from "../models/chart-data-label.models";

@Directive({
    selector: "ng-template[monaChartDataLabel]"
})
export class ChartDataLabelTemplateDirective<T = unknown> {
    public readonly templateRef = inject<TemplateRef<ChartDataLabelContext<T>>>(TemplateRef);
}
