import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    radioButtonCircleVariants as annaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as annaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants as annaRadioButtonDirectiveVariants,
    radioButtonIndicatorVariants as annaRadioButtonIndicatorVariants,
    radioButtonVariants as annaRadioButtonVariants
} from "./radio.anna.styles";
import {
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants as monaRadioButtonDirectiveVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonVariants as monaRadioButtonVariants
} from "./radio.mona.styles";

export const radioButtonThemeVariants = createThemeStrategy({
    anna: annaRadioButtonVariants,
    mona: monaRadioButtonVariants
});

export const radioButtonCircleThemeVariants = createThemeStrategy({
    anna: annaRadioButtonCircleVariants,
    mona: monaRadioButtonCircleVariants
});

export const radioButtonIndicatorThemeVariants = createThemeStrategy({
    anna: annaRadioButtonIndicatorVariants,
    mona: monaRadioButtonIndicatorVariants
});

export const radioButtonContainerLabelThemeVariants = createThemeStrategy({
    anna: annaRadioButtonContainerLabelVariants,
    mona: monaRadioButtonContainerLabelVariants
});

export const radioButtonDirectiveThemeVariants = createThemeStrategy({
    anna: annaRadioButtonDirectiveVariants,
    mona: monaRadioButtonDirectiveVariants
});

export type RadioButtonContainerLabelVariantProps = VariantProps<
    ReturnType<typeof radioButtonContainerLabelThemeVariants>
>;
export type RadioButtonContainerLabelVariantInput = VariantInputs<RadioButtonContainerLabelVariantProps>;

export type RadioButtonCircleVariantProps = VariantProps<ReturnType<typeof radioButtonCircleThemeVariants>>;
export type RadioButtonCircleVariantInput = VariantInputs<RadioButtonCircleVariantProps>;

export type RadioButtonIndicatorVariantProps = VariantProps<ReturnType<typeof radioButtonIndicatorThemeVariants>>;
export type RadioButtonIndicatorVariantInput = VariantInputs<RadioButtonIndicatorVariantProps>;

export type RadioButtonVariantProps = RadioButtonContainerLabelVariantProps &
    RadioButtonCircleVariantProps &
    RadioButtonIndicatorVariantProps;

export type RadioButtonVariantInput = RadioButtonContainerLabelVariantInput &
    RadioButtonCircleVariantInput &
    RadioButtonIndicatorVariantInput;

export type RadioButtonDirectiveProps = VariantProps<ReturnType<typeof radioButtonDirectiveThemeVariants>>;
export type RadioButtonDirectiveInput = VariantInputs<RadioButtonDirectiveProps>;
