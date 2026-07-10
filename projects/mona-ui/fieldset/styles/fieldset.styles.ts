import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants,
    fieldsetVariants as monaFieldsetVariants
} from "./fieldset.mona.styles";

const fieldsetBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaFieldsetBaseVariants },
    monaFieldsetBaseVariants
);

export const fieldsetBaseThemeVariants = (theme: ThemeStyle) => fieldsetBaseThemeVariantsStrategy.resolve(theme);

const fieldsetThemeVariantsStrategy = createThemeStrategy({ mona: monaFieldsetVariants }, monaFieldsetVariants);

export const fieldsetThemeVariants = (theme: ThemeStyle) => fieldsetThemeVariantsStrategy.resolve(theme);

const fieldsetLegendThemeVariantsStrategy = createThemeStrategy(
    { mona: monaFieldsetLegendVariants },
    monaFieldsetLegendVariants
);

export const fieldsetLegendThemeVariants = (theme: ThemeStyle) => fieldsetLegendThemeVariantsStrategy.resolve(theme);

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
