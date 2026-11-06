export interface LabelFocusable {
    /** Runs instead of `focus()` on a click, for a control a native label would activate. */
    activateFromLabel?(): void;
    focus(options?: FocusOptions): void;
    /** Receives the id of the label's text, so the control can use it for `aria-labelledby`. */
    setLabelledBy?(id: string | null): void;
}

export type LabelTarget = string | LabelFocusable | null | undefined;
