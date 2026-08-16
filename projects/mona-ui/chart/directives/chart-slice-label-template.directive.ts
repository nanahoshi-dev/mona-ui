import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartSliceLabelTemplateContext } from "../models/chart-polar.models";

@Directive({
    selector: "ng-template[monaChartSliceLabelTemplate]"
})
export class ChartSliceLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartSliceLabelTemplateContext>>(TemplateRef);
}
