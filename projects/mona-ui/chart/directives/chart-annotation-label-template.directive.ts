import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartAnnotationLabelTemplateContext } from "../models/chart-annotation.models";

@Directive({
    selector: "ng-template[monaChartAnnotationLabelTemplate], ng-template[monaChartAnnotationLabel]"
})
export class ChartAnnotationLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartAnnotationLabelTemplateContext>);

    public static ngTemplateContextGuard(
        _dir: ChartAnnotationLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartAnnotationLabelTemplateContext {
        return true;
    }
}
