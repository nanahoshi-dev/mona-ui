import { Directive, inject, TemplateRef } from "@angular/core";
import type { DecadeCellTemplateContext } from "../models/CalendarTemplateContext";

/** Provides a custom template for each year cell in the decade view. */
@Directive({
    selector: "ng-template[monaCalendarDecadeCellTemplate]"
})
export class CalendarDecadeCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<DecadeCellTemplateContext>>(TemplateRef);
}
