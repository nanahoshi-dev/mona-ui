/**
 * The masked text box's clear button, and what it says when a typed character doesn't fit the slot at the caret.
 */
export interface MonaMaskedTextBoxMessages {
    /** Read out when a character doesn't fit a slot that takes something else, such as one of a custom rule. */
    readonly characterNotAllowed: string;
    /** Name of the button that clears the value. */
    readonly clear: string;
    /** Read out when a character doesn't fit a slot that takes a digit. */
    readonly digitOnly: string;
    /** Read out when a character doesn't fit a slot that takes a digit, `+` or `-`. */
    readonly digitOrSignOnly: string;
    /** Read out when a character doesn't fit a slot that takes a letter. */
    readonly letterOnly: string;
    /** Read out when a character doesn't fit a slot that takes a letter or a digit. */
    readonly letterOrDigitOnly: string;
}
