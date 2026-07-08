import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import {
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants,
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants
} from "./checkbox.mona.styles";

export const checkboxInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCheckboxVariants;
        default:
            return monaCheckboxVariants;
    }
};

export const checkmarkThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCheckmarkVariants;
        default:
            return monaCheckmarkVariants;
    }
};

export const checkboxContainerLabelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCheckboxContainerLabelVariants;
        default:
            return monaCheckboxContainerLabelVariants;
    }
};

export const checkboxDirectiveThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCheckboxDirectiveVariants;
        default:
            return monaCheckboxDirectiveVariants;
    }
};

export type CheckboxVariantProps = VariantProps<ReturnType<typeof checkboxContainerLabelThemeVariants>>;
export type CheckboxVariantInput = VariantInputs<CheckboxVariantProps>;

export type CheckmarkVariantProps = VariantProps<ReturnType<typeof checkmarkThemeVariants>>;
export type CheckmarkVariantInput = VariantInputs<CheckmarkVariantProps>;

export type CheckboxDirectiveVariantProps = VariantProps<ReturnType<typeof checkboxDirectiveThemeVariants>>;
export type CheckboxDirectiveVariantInput = VariantInputs<CheckboxDirectiveVariantProps>;
