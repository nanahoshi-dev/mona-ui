import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui/theme/models/Theme";
import { VariantInputs, VariantPropsWithoutNull } from "mona-ui/utils/VariantInputs";
import { buttonGroupVariants, buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";
import { buttonGroupVariants as shadcnButtonGroupVariants } from "./button-group.shadcn.styles";

export const buttonGroupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaButtonGroupVariants;
        case "shadcn":
            return shadcnButtonGroupVariants;
        default:
            return monaButtonGroupVariants;
    }
};

export type ButtonGroupVariantProps = VariantPropsWithoutNull<VariantProps<typeof buttonGroupVariants>>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
