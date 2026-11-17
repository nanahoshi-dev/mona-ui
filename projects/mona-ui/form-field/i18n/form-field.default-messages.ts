// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaFormFieldMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

const PLURAL_RULES = new Intl.PluralRules("en-US");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const FORM_FIELD_DEFAULT_MESSAGES: MonaFormFieldMessages = {
    email: "Enter a valid email address.",
    invalid: "Enter a valid value.",
    max: (max: number) => `The value must be at most ${localizeNumber(max)}.`,
    maxDate: (maxDate: string) => `The date must be on or before ${maxDate}.`,
    maxLength: (maxLength: number) =>
        `Enter at most ${plural(PLURAL_RULES.select(maxLength), { one: () => `${localizeNumber(maxLength)} character`, other: () => `${localizeNumber(maxLength)} characters` })}.`,
    min: (min: number) => `The value must be at least ${localizeNumber(min)}.`,
    minDate: (minDate: string) => `The date must be on or after ${minDate}.`,
    minLength: (minLength: number) =>
        `Enter at least ${plural(PLURAL_RULES.select(minLength), { one: () => `${localizeNumber(minLength)} character`, other: () => `${localizeNumber(minLength)} characters` })}.`,
    optional: "Optional",
    pattern: "Enter a value in the expected format.",
    required: "This field is required."
};
