import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonVariants as monaRadioButtonVariants
} from "./radio.mona.styles";

const radioButtonThemeVariantsStrategy = createThemeStrategy(
    { mona: monaRadioButtonVariants },
    monaRadioButtonVariants
);

export const radioButtonThemeVariants = (theme: ThemeStyle) => radioButtonThemeVariantsStrategy.resolve(theme);

const radioButtonCircleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaRadioButtonCircleVariants },
    monaRadioButtonCircleVariants
);

export const radioButtonCircleThemeVariants = (theme: ThemeStyle) =>
    radioButtonCircleThemeVariantsStrategy.resolve(theme);

const radioButtonIndicatorThemeVariantsStrategy = createThemeStrategy(
    { mona: monaRadioButtonIndicatorVariants },
    monaRadioButtonIndicatorVariants
);

export const radioButtonIndicatorThemeVariants = (theme: ThemeStyle) =>
    radioButtonIndicatorThemeVariantsStrategy.resolve(theme);

const radioButtonContainerLabelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaRadioButtonContainerLabelVariants },
    monaRadioButtonContainerLabelVariants
);

export const radioButtonContainerLabelThemeVariants = (theme: ThemeStyle) =>
    radioButtonContainerLabelThemeVariantsStrategy.resolve(theme);

const radioButtonDirectiveThemeVariantsStrategy = createThemeStrategy(
    { mona: radioButtonDirectiveVariants },
    radioButtonDirectiveVariants
);

export const radioButtonDirectiveThemeVariants = (theme: ThemeStyle) =>
    radioButtonDirectiveThemeVariantsStrategy.resolve(theme);

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
