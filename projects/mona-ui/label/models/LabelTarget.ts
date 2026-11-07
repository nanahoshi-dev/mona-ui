export interface LabelFocusable {
    /** Runs instead of `focus()` on a click, for a control a native label would activate. */
    activateFromLabel?(): void;
    /** Moves focus to the control. The label calls it on a click when the control has no `activateFromLabel`. */
    focus(options?: FocusOptions): void;
    /** Receives the id of the label's text, so the control can use it for `aria-labelledby`. */
    setLabelledBy?(id: string | null): void;
}

export type LabelTarget = string | LabelFocusable | null | undefined;
