import { Directive, inject, TemplateRef } from "@angular/core";
import { InfoTemplateContext } from "../models/InfoTemplateContext";

@Directive({
    selector: "ng-template[monaPagerInfoTemplate]"
})
export class PagerInfoTemplateDirective {
    public readonly templateRef = inject<TemplateRef<InfoTemplateContext>>(TemplateRef);
}
