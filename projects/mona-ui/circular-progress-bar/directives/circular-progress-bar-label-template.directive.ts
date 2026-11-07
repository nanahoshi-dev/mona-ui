import { Directive, inject, TemplateRef } from "@angular/core";
import { LabelTemplateContext } from "../models/LabelTemplateContext";

/**
 * Structural template directive that replaces the default percentage label inside the circle. The template is hidden
 * when `indeterminate` is `true`.
 */
@Directive({
    selector: "ng-template[monaCircularProgressBarLabelTemplate]"
})
export class CircularProgressBarLabelTemplateDirective {
    public readonly templateRef = inject<TemplateRef<LabelTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: CircularProgressBarLabelTemplateDirective,
        _ctx: unknown
    ): _ctx is LabelTemplateContext {
        return true;
    }
}
