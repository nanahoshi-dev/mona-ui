import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartSubtitleTemplateContext } from "../models/chart-axis.models";

@Directive({
    selector: "ng-template[monaChartSubtitleTemplate]"
})
export class ChartSubtitleTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartSubtitleTemplateContext>>(TemplateRef);
}
