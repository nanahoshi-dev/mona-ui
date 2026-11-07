import { Directive, inject, TemplateRef } from "@angular/core";
import type { MonthCellTemplateContext } from "../models/CalendarTemplateContext";

/** Provides a custom template for each day cell in the month view. */
@Directive({
    selector: "ng-template[monaCalendarMonthCellTemplate]"
})
export class CalendarMonthCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<MonthCellTemplateContext>>(TemplateRef);
}
