import { Directive, inject, TemplateRef } from "@angular/core";
import type { MonthCellTemplateContext } from "../models/CalendarTemplateContext";

@Directive({
    selector: "ng-template[monaCalendarMonthCellTemplate]"
})
export class CalendarMonthCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<MonthCellTemplateContext>>(TemplateRef);
}
