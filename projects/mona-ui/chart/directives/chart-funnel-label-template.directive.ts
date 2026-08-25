import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartFunnelLabelTemplateContext } from "../models/chart-funnel.models";

@Directive({
    selector: "ng-template[monaChartFunnelLabelTemplate]"
})
export class ChartFunnelLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartFunnelLabelTemplateContext>);

    public static ngTemplateContextGuard(
        _dir: ChartFunnelLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartFunnelLabelTemplateContext {
        return true;
    }
}
