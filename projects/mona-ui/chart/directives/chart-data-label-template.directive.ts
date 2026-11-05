import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartDataLabelContext } from "../models/chart-data-label.models";

@Directive({
    selector: "ng-template[monaChartDataLabelTemplate], ng-template[monaChartDataLabel]"
})
export class ChartDataLabelTemplateDirective<T = unknown> {
    public readonly templateRef = inject<TemplateRef<ChartDataLabelContext<T>>>(TemplateRef);

    public static ngTemplateContextGuard<T = unknown>(
        _dir: ChartDataLabelTemplateDirective<T>,
        _ctx: unknown
    ): _ctx is ChartDataLabelContext<T> {
        return true;
    }
}
