import { Directive, inject, TemplateRef } from "@angular/core";
import { DecadeCellTemplateContext } from "../models/CalendarTemplateContext";

@Directive({
    selector: "ng-template[monaCalendarDecadeCellTemplate]"
})
export class CalendarDecadeCellTemplateDirective {
    public readonly templateRef = inject<TemplateRef<DecadeCellTemplateContext>>(TemplateRef);
}
