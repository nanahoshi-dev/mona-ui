import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

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
