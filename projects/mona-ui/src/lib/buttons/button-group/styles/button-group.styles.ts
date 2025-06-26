import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui/theme/models/Theme";
import { VariantInputs, VariantPropsWithoutNull } from "mona-ui/utils/VariantInputs";
import { buttonGroupVariants, buttonGroupVariants as mona } from "./button-group.mona.styles";
import { buttonGroupVariants as shadcn } from "./button-group.shadcn.styles";

export const buttonGroupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return mona;
        case "shadcn":
            return shadcn;
        default:
            return mona;
    }
};

export type ButtonGroupVariantProps = VariantPropsWithoutNull<VariantProps<typeof buttonGroupVariants>>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
