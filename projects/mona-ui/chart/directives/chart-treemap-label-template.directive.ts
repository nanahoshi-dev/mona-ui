import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartTreemapLabelTemplateContext } from "../models/chart-treemap.models";

@Directive({
    selector: "ng-template[monaChartTreemapLabelTemplate]"
})
export class ChartTreemapLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartTreemapLabelTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ChartTreemapLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartTreemapLabelTemplateContext {
        return true;
    }
}
