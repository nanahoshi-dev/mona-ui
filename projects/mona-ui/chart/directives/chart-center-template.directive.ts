import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartCenterTemplateContext } from "../models/chart-polar.models";

@Directive({
    selector: "ng-template[monaChartCenterTemplate]"
})
export class ChartCenterTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartCenterTemplateContext>>(TemplateRef);
}
