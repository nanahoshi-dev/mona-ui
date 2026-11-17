import type { ValidationError } from "@angular/forms/signals";
import type { MonaFormFieldMessages } from "@nanahoshi/mona-ui/i18n";

const numberOf = (error: ValidationError, key: string): number | null => {
    const value: unknown = (error as unknown as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const dateOf = (error: ValidationError, key: string): Date | null => {
    const value: unknown = (error as unknown as Record<string, unknown>)[key];
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
};

/**
 * The text a form field shows for a validation error: the validator's own `message`, else the locale's message for the
 * error's kind, else the locale's generic one.
 *
 * @param formatDate Formats the date of a `minDate` or `maxDate` error in the locale.
 */
export function formFieldErrorMessage(
    error: ValidationError,
    messages: MonaFormFieldMessages,
    formatDate: (date: Date) => string
): string {
    if (error.message) {
        return error.message;
    }
    switch (error.kind) {
        case "email":
            return messages.email;
        case "max": {
            const max = numberOf(error, "max");
            return max === null ? messages.invalid : messages.max(max);
        }
        case "maxDate": {
            const maxDate = dateOf(error, "maxDate");
            return maxDate === null ? messages.invalid : messages.maxDate(formatDate(maxDate));
        }
        case "maxLength": {
            const maxLength = numberOf(error, "maxLength");
            return maxLength === null ? messages.invalid : messages.maxLength(maxLength);
        }
        case "min": {
            const min = numberOf(error, "min");
            return min === null ? messages.invalid : messages.min(min);
        }
        case "minDate": {
            const minDate = dateOf(error, "minDate");
            return minDate === null ? messages.invalid : messages.minDate(formatDate(minDate));
        }
        case "minLength": {
            const minLength = numberOf(error, "minLength");
            return minLength === null ? messages.invalid : messages.minLength(minLength);
        }
        case "pattern":
            return messages.pattern;
        case "required":
            return messages.required;
        default:
            return messages.invalid;
    }
}
