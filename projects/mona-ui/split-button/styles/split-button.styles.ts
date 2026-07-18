import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import { splitButtonVariants as annaSplitButtonVariants } from "./split-button.anna.styles";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";

export const splitButtonThemeVariants = createThemeStrategy({
    anna: annaSplitButtonVariants,
    mona: monaSplitButtonVariants
});

export type SplitButtonVariantProps = VariantProps<ReturnType<typeof splitButtonThemeVariants>>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
