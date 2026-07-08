import { Directive, inject, TemplateRef } from "@angular/core";
import { LabelTemplateContext } from "../models/LabelTemplateContext";

@Directive({
    selector: "ng-template[monaCircularProgressBarLabelTemplate]"
})
export class CircularProgressBarLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<LabelTemplateContext>>(TemplateRef);
}
