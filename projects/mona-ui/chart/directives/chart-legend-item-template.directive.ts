import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartLegendItemTemplateContext } from "../models/chart-series.models";

@Directive({
    selector: "ng-template[monaChartLegendItemTemplate]"
})
export class ChartLegendItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartLegendItemTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ChartLegendItemTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartLegendItemTemplateContext {
        return true;
    }
}
