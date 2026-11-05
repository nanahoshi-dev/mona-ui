import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartSliceLabelTemplateContext } from "../models/chart-polar.models";

@Directive({
    selector: "ng-template[monaChartSliceLabelTemplate]"
})
export class ChartSliceLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartSliceLabelTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ChartSliceLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartSliceLabelTemplateContext {
        return true;
    }
}
