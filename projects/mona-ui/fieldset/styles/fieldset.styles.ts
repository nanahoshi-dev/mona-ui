import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants,
    fieldsetVariants as monaFieldsetVariants
} from "./fieldset.mona.styles";

export const fieldsetBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFieldsetBaseVariants;
        default:
            return monaFieldsetBaseVariants;
    }
};

export const fieldsetThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFieldsetVariants;
        default:
            return monaFieldsetVariants;
    }
};

export const fieldsetLegendThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFieldsetLegendVariants;
        default:
            return monaFieldsetLegendVariants;
    }
};

type FieldsetBaseVariantProps = VariantProps<ReturnType<typeof fieldsetBaseThemeVariants>>;
type FieldsetBaseVariantInput = VariantInputs<FieldsetBaseVariantProps>;
type FieldsetFieldsetVariantProps = VariantProps<ReturnType<typeof fieldsetThemeVariants>>;
type FieldsetFieldsetVariantInput = VariantInputs<FieldsetFieldsetVariantProps>;
type FieldsetLegendVariantProps = VariantProps<ReturnType<typeof fieldsetLegendThemeVariants>>;
type FieldsetLegendVariantInput = VariantInputs<FieldsetLegendVariantProps>;

export type FieldsetVariantProps = FieldsetBaseVariantProps & FieldsetFieldsetVariantProps & FieldsetLegendVariantProps;
export type FieldsetVariantInput = FieldsetBaseVariantInput &
    FieldsetFieldsetVariantInput &
    Omit<FieldsetLegendVariantInput, "hasTemplate">;
