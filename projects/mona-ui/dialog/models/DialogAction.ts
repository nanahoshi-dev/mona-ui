import type { ButtonVariantProps } from "@nanahoshi/mona-ui/button";

export interface DialogAction<T = unknown> {
    cssClass?: string;
    data?: T;
    /**
     * The action Enter triggers when focus is in the dialog but not on a button, link, text area or other control
     * that handles Enter itself. Mark at most one action.
     */
    default?: boolean;
    iconOnly?: boolean;
    look?: ButtonVariantProps["look"];
    rounded?: ButtonVariantProps["rounded"];
    text: string;
}
