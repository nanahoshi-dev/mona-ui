import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
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

export type DropdownButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
