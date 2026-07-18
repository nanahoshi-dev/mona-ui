import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    switchHandleVariants as annaSwitchHandleVariants,
    switchLabelVariants as annaSwitchLabelVariants,
    switchVariants as annaSwitchVariants
} from "./switch.anna.styles";
import {
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants,
    switchVariants as monaSwitchVariants
} from "./switch.mona.styles";

export const switchThemeVariants = createThemeStrategy({
    anna: annaSwitchVariants,
    mona: monaSwitchVariants
});

export const switchHandleThemeVariants = createThemeStrategy({
    anna: annaSwitchHandleVariants,
    mona: monaSwitchHandleVariants
});

export const switchLabelThemeVariants = createThemeStrategy({
    anna: annaSwitchLabelVariants,
    mona: monaSwitchLabelVariants
});

type SwitchBaseVariantProps = VariantProps<ReturnType<typeof switchThemeVariants>>;
type SwitchBaseVariantInput = VariantInputs<SwitchBaseVariantProps>;

type SwitchHandleVariantProps = VariantProps<ReturnType<typeof switchHandleThemeVariants>>;
type SwitchHandleVariantInput = VariantInputs<SwitchHandleVariantProps>;

type SwitchLabelVariantProps = VariantProps<ReturnType<typeof switchLabelThemeVariants>>;
type SwitchLabelVariantInput = VariantInputs<SwitchLabelVariantProps>;

export type SwitchVariantProps = SwitchBaseVariantProps & SwitchHandleVariantProps & SwitchLabelVariantProps;
export type SwitchVariantInputs = SwitchBaseVariantInput & SwitchHandleVariantInput & SwitchLabelVariantInput;
