import type { ValidationError } from "@angular/forms/signals";
import { FORM_FIELD_DEFAULT_MESSAGES } from "../i18n/form-field.default-messages";
import { formFieldErrorMessage } from "./form-field-error-message";

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

function messageFor(error: Record<string, unknown> & { kind: string }): string {
    return formFieldErrorMessage(error as ValidationError, FORM_FIELD_DEFAULT_MESSAGES, formatDate);
}

describe("formFieldErrorMessage", () => {
    it("prefers the validator's own message", () => {
        expect(messageFor({ kind: "required", message: "Tell us your name." })).toBe("Tell us your name.");
        expect(messageFor({ kind: "taken", message: "That name is taken." })).toBe("That name is taken.");
    });

    it.each([
        [{ kind: "required" }, "This field is required."],
        [{ kind: "email" }, "Enter a valid email address."],
        [{ kind: "pattern", pattern: /\d+/ }, "Enter a value in the expected format."],
        [{ kind: "min", min: 1200 }, "The value must be at least 1,200."],
        [{ kind: "max", max: 0.5 }, "The value must be at most 0.5."],
        [{ kind: "minLength", minLength: 1 }, "Enter at least 1 character."],
        [{ kind: "minLength", minLength: 8 }, "Enter at least 8 characters."],
        [{ kind: "maxLength", maxLength: 1 }, "Enter at most 1 character."],
        [{ kind: "maxLength", maxLength: 280 }, "Enter at most 280 characters."],
        [{ kind: "minDate", minDate: new Date(Date.UTC(2026, 0, 2)) }, "The date must be on or after 2026-01-02."],
        [{ kind: "maxDate", maxDate: new Date(Date.UTC(2026, 11, 31)) }, "The date must be on or before 2026-12-31."]
    ])("names the %o error", (error, message) => {
        expect(messageFor(error)).toBe(message);
    });

    it("falls back to the generic message for other kinds and for errors without their bound", () => {
        expect(messageFor({ kind: "parse" })).toBe("Enter a valid value.");
        expect(messageFor({ kind: "taken" })).toBe("Enter a valid value.");
        expect(messageFor({ kind: "min" })).toBe("Enter a valid value.");
        expect(messageFor({ kind: "maxLength", maxLength: Number.NaN })).toBe("Enter a valid value.");
        expect(messageFor({ kind: "minDate", minDate: new Date(Number.NaN) })).toBe("Enter a valid value.");
    });
});
