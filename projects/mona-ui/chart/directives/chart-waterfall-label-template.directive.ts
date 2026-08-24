import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartWaterfallLabelTemplateContext } from "../models/chart-waterfall.models";

@Directive({
    selector: "ng-template[monaChartWaterfallLabelTemplate]"
})
export class ChartWaterfallLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartWaterfallLabelTemplateContext>);

    public static ngTemplateContextGuard(
        _dir: ChartWaterfallLabelTemplateDirective,
        ctx: unknown
    ): ctx is ChartWaterfallLabelTemplateContext {
        return true;
    }
}
