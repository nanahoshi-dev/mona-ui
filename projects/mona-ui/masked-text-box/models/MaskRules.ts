/**
 * Mask characters of your own, each mapped to a pattern that one character must match, such as `{ H: /[0-9a-f]/i }`
 * for a hexadecimal digit. A slot made by a custom rule is required. A rule can replace a built-in one, such as `0`.
 */
export type MaskRules = Readonly<Record<string, RegExp>>;

/**
 * How a value is read against a mask, for {@link isMaskComplete} and {@link formatMaskedValue}. Pass what the masked
 * text box is given.
 */
export interface MaskOptions {
    /** Whether the value includes the mask's literal characters, as the masked text box's `includeLiterals`. */
    readonly includeLiterals?: boolean;
    /** Custom mask characters, as the masked text box's `rules`. */
    readonly rules?: MaskRules;
}
