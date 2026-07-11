import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants,
    fieldsetVariants as monaFieldsetVariants
} from "./fieldset.mona.styles";
import {
    reinaFieldsetBaseVariants,
    reinaFieldsetLegendVariants,
    reinaFieldsetVariants
} from "./fieldset.reina.styles";
import {
    createFieldsetBaseVariants,
    createFieldsetFieldsetVariants,
    createFieldsetLegendVariants
} from "./fieldset.style-composition";
import type {
    FieldsetBaseVariantsFunction,
    FieldsetFieldsetVariantsFunction,
    FieldsetLegendVariantsFunction,
    FieldsetStyleOverrides,
    FieldsetStyleStrategy,
    FieldsetVariantsFunctions
} from "./fieldset.types";

const defaultFieldsetBaseStrategy = createThemeStrategy<FieldsetBaseVariantsFunction>(
    { mona: monaFieldsetBaseVariants, reina: reinaFieldsetBaseVariants },
    monaFieldsetBaseVariants
);
const defaultFieldsetFieldsetStrategy = createThemeStrategy<FieldsetFieldsetVariantsFunction>(
    { mona: monaFieldsetVariants, reina: reinaFieldsetVariants },
    monaFieldsetVariants
);
const defaultFieldsetLegendStrategy = createThemeStrategy<FieldsetLegendVariantsFunction>(
    { mona: monaFieldsetLegendVariants, reina: reinaFieldsetLegendVariants },
    monaFieldsetLegendVariants
);

export const fieldsetBaseThemeVariants = (theme: ThemeStyle): FieldsetBaseVariantsFunction =>
    defaultFieldsetBaseStrategy.resolve(theme);

export const fieldsetThemeVariants = (theme: ThemeStyle): FieldsetFieldsetVariantsFunction =>
    defaultFieldsetFieldsetStrategy.resolve(theme);

export const fieldsetLegendThemeVariants = (theme: ThemeStyle): FieldsetLegendVariantsFunction =>
    defaultFieldsetLegendStrategy.resolve(theme);

export function createFieldsetStyleStrategy(overrides: readonly FieldsetStyleOverrides[] = []): FieldsetStyleStrategy {
    const mona: FieldsetVariantsFunctions = {
        base: createFieldsetBaseVariants(monaFieldsetBaseVariants, overrides, "mona"),
        fieldset: createFieldsetFieldsetVariants(monaFieldsetVariants, overrides, "mona"),
        legend: createFieldsetLegendVariants(monaFieldsetLegendVariants, overrides, "mona")
    };
    const reina: FieldsetVariantsFunctions = {
        base: createFieldsetBaseVariants(reinaFieldsetBaseVariants, overrides, "reina"),
        fieldset: createFieldsetFieldsetVariants(reinaFieldsetVariants, overrides, "reina"),
        legend: createFieldsetLegendVariants(reinaFieldsetLegendVariants, overrides, "reina")
    };
    return createThemeStrategy<FieldsetVariantsFunctions>({ mona, reina }, mona);
}
