export interface LabelFocusable {
    focus(options?: FocusOptions): void;
}

export type LabelTarget = string | LabelFocusable | null | undefined;
