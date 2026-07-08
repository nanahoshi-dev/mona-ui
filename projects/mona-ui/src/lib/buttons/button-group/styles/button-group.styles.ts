import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import { buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";

export const buttonGroupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaButtonGroupVariants;
        default:
            return monaButtonGroupVariants;
    }
};

export type ButtonGroupVariantProps = VariantProps<ReturnType<typeof buttonGroupThemeVariants>>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
