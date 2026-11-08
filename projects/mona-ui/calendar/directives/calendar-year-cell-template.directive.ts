import { Directive, inject, TemplateRef } from "@angular/core";
import type { YearCellTemplateContext } from "../models/CalendarTemplateContext";

/** Provides a custom template for each month cell in the year (month-selection) view. */
@Directive({
    selector: "ng-template[monaCalendarYearCellTemplate]"
})
export class CalendarYearCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<YearCellTemplateContext>>(TemplateRef);
}
