import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui/theme/models/Theme";
import { VariantInputs } from "mona-ui/utils/VariantInputs";
import { buttonVariants as mona } from "./button.mona.styles";
import { buttonVariants as shadcn } from "./button.shadcn.styles";

export const themeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return mona;
        case "shadcn":
            return shadcn;
        default:
            return mona;
    }
};

export type ButtonVariantProps = VariantProps<ReturnType<typeof themeVariants>>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;
export type DropdownButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
