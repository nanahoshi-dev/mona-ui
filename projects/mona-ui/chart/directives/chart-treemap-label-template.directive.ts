import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartTreemapLabelTemplateContext } from "../models/chart-treemap.models";

@Directive({
    selector: "ng-template[monaChartTreemapLabelTemplate]"
})
export class ChartTreemapLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartTreemapLabelTemplateContext>>(TemplateRef);
}
