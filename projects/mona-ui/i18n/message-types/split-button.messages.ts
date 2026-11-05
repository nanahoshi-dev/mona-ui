export interface MonaSplitButtonMessages {
    /** The arrow button's name when the main button has no `text` (it shows a template instead). */
    readonly menuButtonAriaLabel: string;
    /** The arrow button's name, from the main button's `text`. */
    readonly menuButtonWithText: (text: string) => string;
    /** @deprecated No longer rendered; the main button is named by its content or by `aria-label`. */
    readonly splitButton: (text: string) => string;
}

