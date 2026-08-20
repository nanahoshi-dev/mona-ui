import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartAnnotationLabelTemplateContext } from "../models/chart-annotation.models";

@Directive({
    selector: "ng-template[monaChartAnnotationLabel]"
})
export class ChartAnnotationLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartAnnotationLabelTemplateContext>);
}
