import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartGaugeCenterTemplateContext } from "../models/chart-radial-arc.models";

@Directive({
    selector: "ng-template[monaChartGaugeCenterTemplate]"
})
export class ChartGaugeCenterTemplateDirective {
    public readonly templateRef = inject<TemplateRef<ChartGaugeCenterTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ChartGaugeCenterTemplateDirective,
        _ctx: unknown
    ): _ctx is ChartGaugeCenterTemplateContext {
        return true;
    }
}
