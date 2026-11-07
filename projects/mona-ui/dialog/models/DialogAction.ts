import type { ButtonVariantProps } from "@nanahoshi/mona-ui/button";

export interface DialogAction<T = unknown> {
    /** Additional class applied to the action button. */
    cssClass?: string;
    /** Arbitrary data associated with the action, readable from `DialogActionEvent.action.data`. */
    data?: T;
    /**
     * The action Enter triggers when focus is in the dialog but not on a button, link, text area or other control
     * that handles Enter itself. Mark at most one action.
     */
    default?: boolean;
    /** Renders the button as icon-only. */
    iconOnly?: boolean;
    /** The action button's visual style. */
    look?: ButtonVariantProps["look"];
    /** The action button's border-radius preset. Falls back to the dialog's own `rounded` when omitted. */
    rounded?: ButtonVariantProps["rounded"];
    /** Required. The button's label. */
    text: string;
}
