import { Directive, inject, TemplateRef } from "@angular/core";
import type { LabelTemplateContext } from "mona-ui/progress-bars/models/LabelTemplateContext";

@Directive({
    selector: "ng-template[monaProgressBarLabelTemplate]"
})
export class ProgressBarLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<LabelTemplateContext>>(TemplateRef);
}
