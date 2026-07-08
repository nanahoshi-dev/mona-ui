import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";

export const splitButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSplitButtonVariants;
        default:
            return monaSplitButtonVariants; // Default to Mona styles
    }
};

export type SplitButtonVariantProps = VariantProps<ReturnType<typeof splitButtonThemeVariants>>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
