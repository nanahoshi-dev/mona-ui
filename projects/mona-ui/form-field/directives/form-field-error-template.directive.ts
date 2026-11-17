import { Directive } from "@angular/core";
import type { FormFieldErrorTemplateContext } from "../models/FormFieldErrorTemplateContext";

/**
 * Renders each error the form field shows, in place of its message. The context's `$implicit` is the message and
 * `error` is the validation error, or null for the form field's `error` input.
 */
@Directive({
    selector: "ng-template[monaFormFieldErrorTemplate]"
})
export class FormFieldErrorTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: FormFieldErrorTemplateDirective,
        _context: unknown
    ): _context is FormFieldErrorTemplateContext {
        return true;
    }
}
