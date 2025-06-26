import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui";
import { splitButtonVariants as mona } from "mona-ui/buttons/split-button/styles/split-button.mona.styles";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const splitButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return mona;
        case "shadcn":
            return mona; // Placeholder for Shadcn styles, if available
        default:
            return mona; // Default to Mona styles
    }
};

export type SplitButtonVariantProps = VariantProps<ReturnType<typeof splitButtonThemeVariants>>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
