import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    fieldsetBaseVariants as annaFieldsetBaseVariants,
    fieldsetLegendVariants as annaFieldsetLegendVariants,
    fieldsetVariants as annaFieldsetVariants
} from "./fieldset.anna.styles";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants,
    fieldsetVariants as monaFieldsetVariants
} from "./fieldset.mona.styles";

export const fieldsetBaseThemeVariants = createThemeStrategy({
    anna: annaFieldsetBaseVariants,
    mona: monaFieldsetBaseVariants
});

export const fieldsetThemeVariants = createThemeStrategy({
    anna: annaFieldsetVariants,
    mona: monaFieldsetVariants
});

export const fieldsetLegendThemeVariants = createThemeStrategy({
    anna: annaFieldsetLegendVariants,
    mona: monaFieldsetLegendVariants
});

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
