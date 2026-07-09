import { ButtonVariantProps } from "@nanahoshi/mona-ui/button";

export interface DialogAction<T = unknown> {
    cssClass?: string;
    data?: T;
    iconOnly?: boolean;
    look?: ButtonVariantProps["look"];
    rounded?: ButtonVariantProps["rounded"];
    text: string;
}
