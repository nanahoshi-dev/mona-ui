import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants,
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants
} from "./checkbox.mona.styles";

const checkboxInputThemeVariantsStrategy = createThemeStrategy({ mona: monaCheckboxVariants }, monaCheckboxVariants);

export const checkboxInputThemeVariants = (theme: ThemeStyle) => checkboxInputThemeVariantsStrategy.resolve(theme);

const checkmarkThemeVariantsStrategy = createThemeStrategy({ mona: monaCheckmarkVariants }, monaCheckmarkVariants);

export const checkmarkThemeVariants = (theme: ThemeStyle) => checkmarkThemeVariantsStrategy.resolve(theme);

const checkboxContainerLabelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCheckboxContainerLabelVariants },
    monaCheckboxContainerLabelVariants
);

export const checkboxContainerLabelThemeVariants = (theme: ThemeStyle) =>
    checkboxContainerLabelThemeVariantsStrategy.resolve(theme);

const checkboxDirectiveThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCheckboxDirectiveVariants },
    monaCheckboxDirectiveVariants
);

export const checkboxDirectiveThemeVariants = (theme: ThemeStyle) =>
    checkboxDirectiveThemeVariantsStrategy.resolve(theme);

export type CheckboxVariantProps = VariantProps<ReturnType<typeof checkboxContainerLabelThemeVariants>>;
export type CheckboxVariantInput = VariantInputs<CheckboxVariantProps>;

export type CheckmarkVariantProps = VariantProps<ReturnType<typeof checkmarkThemeVariants>>;
export type CheckmarkVariantInput = VariantInputs<CheckmarkVariantProps>;

export type CheckboxDirectiveVariantProps = VariantProps<ReturnType<typeof checkboxDirectiveThemeVariants>>;
export type CheckboxDirectiveVariantInput = VariantInputs<CheckboxDirectiveVariantProps>;
