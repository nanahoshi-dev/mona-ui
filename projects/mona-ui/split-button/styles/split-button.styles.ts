import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
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
