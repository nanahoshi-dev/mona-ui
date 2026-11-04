import { Directive, inject, TemplateRef } from "@angular/core";
import type { YearCellTemplateContext } from "../models/CalendarTemplateContext";

@Directive({
    selector: "ng-template[monaCalendarYearCellTemplate]"
})
export class CalendarYearCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<YearCellTemplateContext>>(TemplateRef);
}
