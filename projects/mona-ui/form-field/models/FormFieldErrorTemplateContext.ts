import type { ValidationError } from "@angular/forms/signals";

/**
 * The context of a `monaFormFieldErrorTemplate`, rendered once for each error the form field shows.
 */
export interface FormFieldErrorTemplateContext {
    /** The message the form field would show: the validator's own, or the locale's message for the error's kind. */
    readonly $implicit: string;
    /** The validation error, or null for the text of the form field's `error` input. */
    readonly error: ValidationError | null;
    /** The same message as `$implicit`, for `let-message="message"`. */
    readonly message: string;
}
