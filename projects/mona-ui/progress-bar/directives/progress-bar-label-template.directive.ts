import { Directive, inject, TemplateRef } from "@angular/core";
import type { LabelTemplateContext } from "../models/LabelTemplateContext";

@Directive({
    selector: "ng-template[monaProgressBarLabelTemplate]"
})
export class ProgressBarLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<LabelTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ProgressBarLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is LabelTemplateContext {
        return true;
    }
}
