import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui";
import { splitButtonVariants as monaSplitButtonVariants } from "mona-ui/buttons/split-button/styles/split-button.mona.styles";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const splitButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSplitButtonVariants;
        case "shadcn":
            return monaSplitButtonVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaSplitButtonVariants; // Default to Mona styles
    }
};

export type SplitButtonVariantProps = VariantProps<ReturnType<typeof splitButtonThemeVariants>>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
