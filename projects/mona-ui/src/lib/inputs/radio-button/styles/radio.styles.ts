import { cva, VariantProps } from "class-variance-authority";
import {
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonVariants as monaRadioButtonVariants
} from "./radio.mona.styles";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";

export const radioButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaRadioButtonVariants;
        case "shadcn":
            return monaRadioButtonVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaRadioButtonVariants; // Default to Mona styles
    }
};

export const radioButtonCircleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaRadioButtonCircleVariants;
        case "shadcn":
            return monaRadioButtonCircleVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaRadioButtonCircleVariants; // Default to Mona styles
    }
};

export const radioButtonIndicatorThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaRadioButtonIndicatorVariants;
        case "shadcn":
            return monaRadioButtonIndicatorVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaRadioButtonIndicatorVariants; // Default to Mona styles
    }
};

export const radioButtonContainerLabelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaRadioButtonContainerLabelVariants;
        case "shadcn":
            return monaRadioButtonContainerLabelVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaRadioButtonContainerLabelVariants; // Default to Mona styles
    }
};

export const radioButtonDirectiveThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return radioButtonDirectiveVariants;
        case "shadcn":
            return radioButtonDirectiveVariants; // Placeholder for Shadcn styles, if available
        default:
            return radioButtonDirectiveVariants; // Default to Mona styles
    }
};

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
