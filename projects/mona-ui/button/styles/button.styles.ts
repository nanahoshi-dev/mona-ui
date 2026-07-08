import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@mirei/mona-ui/internal";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { buttonVariants as monaButtonVariants } from "./button.mona.styles";

export const buttonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaButtonVariants;
        default:
            return monaButtonVariants;
    }
};

export type ButtonVariantProps = VariantProps<ReturnType<typeof buttonThemeVariants>>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;
