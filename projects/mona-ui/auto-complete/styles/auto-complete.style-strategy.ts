import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants
} from "./auto-complete.mona.styles";
import {
    reinaAutoCompleteAffixContainerVariants,
    reinaAutoCompleteBaseVariants,
    reinaAutoCompleteTextInputVariants
} from "./auto-complete.reina.styles";
import {
    createAutoCompleteAffixContainerVariants,
    createAutoCompleteBaseVariants,
    createAutoCompleteTextInputVariants
} from "./auto-complete.style-composition";
import type {
    AutoCompleteAffixContainerVariantsFunction,
    AutoCompleteBaseVariantsFunction,
    AutoCompleteStyleOverrides,
    AutoCompleteStyleStrategy,
    AutoCompleteTextInputVariantsFunction,
    AutoCompleteVariantsFunctions
} from "./auto-complete.types";

const defaultAutoCompleteBaseStrategy = createInheritedThemeStrategy<AutoCompleteBaseVariantsFunction>(
    monaAutoCompleteBaseVariants,
    { reina: reinaAutoCompleteBaseVariants }
);
const defaultAutoCompleteTextInputStrategy = createInheritedThemeStrategy<AutoCompleteTextInputVariantsFunction>(
    monaAutoCompleteTextInputVariants,
    { reina: reinaAutoCompleteTextInputVariants }
);
const defaultAutoCompleteAffixContainerStrategy =
    createInheritedThemeStrategy<AutoCompleteAffixContainerVariantsFunction>(monaAutoCompleteAffixContainerVariants, {
        reina: reinaAutoCompleteAffixContainerVariants
    });

export const autoCompleteBaseThemeVariants = (theme: ThemeStyle): AutoCompleteBaseVariantsFunction =>
    defaultAutoCompleteBaseStrategy.resolve(theme);
export const autoCompleteTextInputThemeVariants = (theme: ThemeStyle): AutoCompleteTextInputVariantsFunction =>
    defaultAutoCompleteTextInputStrategy.resolve(theme);
export const autoCompleteAffixContainerThemeVariants = (
    theme: ThemeStyle
): AutoCompleteAffixContainerVariantsFunction => defaultAutoCompleteAffixContainerStrategy.resolve(theme);

export function createAutoCompleteStyleStrategy(
    overrides: readonly AutoCompleteStyleOverrides[] = []
): AutoCompleteStyleStrategy {
    const mona: AutoCompleteVariantsFunctions = {
        affixContainer: createAutoCompleteAffixContainerVariants(
            monaAutoCompleteAffixContainerVariants,
            overrides,
            "mona"
        ),
        base: createAutoCompleteBaseVariants(monaAutoCompleteBaseVariants, overrides, "mona"),
        textInput: createAutoCompleteTextInputVariants(monaAutoCompleteTextInputVariants, overrides, "mona")
    };
    const reina: AutoCompleteVariantsFunctions = {
        affixContainer: createAutoCompleteAffixContainerVariants(
            reinaAutoCompleteAffixContainerVariants,
            overrides,
            "reina"
        ),
        base: createAutoCompleteBaseVariants(reinaAutoCompleteBaseVariants, overrides, "reina"),
        textInput: createAutoCompleteTextInputVariants(reinaAutoCompleteTextInputVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<AutoCompleteVariantsFunctions>(mona, { reina: reina });
}
