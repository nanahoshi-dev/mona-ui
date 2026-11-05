import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartReferenceLabelTemplateContext } from "../models/chart-annotation.models";

@Directive({
    selector: "ng-template[monaChartReferenceLabelTemplate], ng-template[monaChartReferenceLabel]"
})
export class ChartReferenceLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartReferenceLabelTemplateContext>);

    public static ngTemplateContextGuard(
        _dir: ChartReferenceLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartReferenceLabelTemplateContext {
        return true;
    }
}
