import { ButtonVariantProps } from "../../../buttons/button/styles/button.styles";

export interface DialogAction<T = unknown> {
    cssClass?: string;
    data?: T;
    iconOnly?: boolean;
    look?: ButtonVariantProps["look"];
    rounded?: ButtonVariantProps["rounded"];
    text: string;
}
