import { ButtonVariantProps } from "../../../buttons/button/styles/button.styles";

export interface DialogAction<T = unknown> {
    cssClass?: string | Iterable<string> | Record<string, boolean>;
    data?: T;
    iconOnly?: boolean;
    look?: ButtonVariantProps["look"];
    rounded?: ButtonVariantProps["rounded"];
    text: string;
}
