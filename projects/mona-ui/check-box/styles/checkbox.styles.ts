import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    checkboxContainerLabelVariants as annaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as annaCheckboxDirectiveVariants,
    checkboxVariants as annaCheckboxVariants,
    checkmarkVariants as annaCheckmarkVariants
} from "./checkbox.anna.styles";
import {
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants,
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants
} from "./checkbox.mona.styles";

export const checkboxInputThemeVariants = createThemeStrategy({
    anna: annaCheckboxVariants,
    mona: monaCheckboxVariants
});

export const checkmarkThemeVariants = createThemeStrategy({
    anna: annaCheckmarkVariants,
    mona: monaCheckmarkVariants
});

export const checkboxContainerLabelThemeVariants = createThemeStrategy({
    anna: annaCheckboxContainerLabelVariants,
    mona: monaCheckboxContainerLabelVariants
});

export const checkboxDirectiveThemeVariants = createThemeStrategy({
    anna: annaCheckboxDirectiveVariants,
    mona: monaCheckboxDirectiveVariants
});

export type CheckboxVariantProps = VariantProps<ReturnType<typeof checkboxContainerLabelThemeVariants>>;
export type CheckboxVariantInput = VariantInputs<CheckboxVariantProps>;

export type CheckmarkVariantProps = VariantProps<ReturnType<typeof checkmarkThemeVariants>>;
export type CheckmarkVariantInput = VariantInputs<CheckmarkVariantProps>;

export type CheckboxDirectiveVariantProps = VariantProps<ReturnType<typeof checkboxDirectiveThemeVariants>>;
export type CheckboxDirectiveVariantInput = VariantInputs<CheckboxDirectiveVariantProps>;
