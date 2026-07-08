import { Directive, inject, TemplateRef } from "@angular/core";
import type { LabelTemplateContext } from "../models/LabelTemplateContext";

@Directive({
    selector: "ng-template[monaProgressBarLabelTemplate]"
})
export class ProgressBarLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<LabelTemplateContext>>(TemplateRef);
}
