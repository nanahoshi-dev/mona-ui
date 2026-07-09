import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants,
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants
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
