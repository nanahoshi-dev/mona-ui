import { ThemeStyle } from "../../../theme/models/Theme";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetVariants as monaFieldsetVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants
} from "./fieldset.mona.styles";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "../../../utils/VariantInputs";

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
