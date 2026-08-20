import { Directive, inject, TemplateRef } from "@angular/core";
import type { ChartCrosshairAxisLabelContext } from "../models/chart-crosshair.models";

@Directive({
    selector: "ng-template[monaChartCrosshairLabel]"
})
export class ChartCrosshairLabelTemplateDirective {
    public readonly templateRef = inject(TemplateRef<ChartCrosshairAxisLabelContext>);
}
