/**
 * The form field's optional marker and the error messages it shows for the built-in signal forms validators. A
 * validator's own `message` wins over these.
 */
export interface MonaFormFieldMessages {
    /** For an `email` error. */
    readonly email: string;

    /** For an error of a kind without a message of its own, such as a custom validator's or a parse error. */
    readonly invalid: string;

    /** For a `max` error. */
    max(max: number): string;

    /** For a `maxDate` error, with the date formatted in the locale. */
    maxDate(maxDate: string): string;

    /** For a `maxLength` error. */
    maxLength(maxLength: number): string;

    /** For a `min` error. */
    min(min: number): string;

    /** For a `minDate` error, with the date formatted in the locale. */
    minDate(minDate: string): string;

    /** For a `minLength` error. */
    minLength(minLength: number): string;

    /** Shown after the label of a field marked `optional`. */
    readonly optional: string;

    /** For a `pattern` error. */
    readonly pattern: string;

    /** For a `required` error. */
    readonly required: string;
}
