import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants,
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants
} from "./dropdown-list.mona.styles";
import {
    reinaDropdownListAffixContainerVariants,
    reinaDropdownListInputVariants,
    reinaDropdownListValueContainerVariants
} from "./dropdown-list.reina.styles";
import {
    createDropdownListAffixContainerVariants,
    createDropdownListInputVariants,
    createDropdownListValueContainerVariants
} from "./dropdown-list.style-composition";
import type {
    DropdownListAffixContainerVariantsFunction,
    DropdownListInputVariantsFunction,
    DropdownListStyleOverrides,
    DropdownListStyleStrategy,
    DropdownListValueContainerVariantsFunction,
    DropdownListVariantsFunctions
} from "./dropdown-list.types";

const defaultDropdownListInputStrategy = createThemeStrategy<DropdownListInputVariantsFunction>(
    { mona: monaDropdownListInputVariants, reina: reinaDropdownListInputVariants },
    monaDropdownListInputVariants
);
const defaultDropdownListAffixContainerStrategy = createThemeStrategy<DropdownListAffixContainerVariantsFunction>(
    { mona: monaDropdownListAffixContainerVariants, reina: reinaDropdownListAffixContainerVariants },
    monaDropdownListAffixContainerVariants
);
const defaultDropdownListValueContainerStrategy = createThemeStrategy<DropdownListValueContainerVariantsFunction>(
    { mona: monaDropdownListValueContainerVariants, reina: reinaDropdownListValueContainerVariants },
    monaDropdownListValueContainerVariants
);

export const dropdownListInputThemeVariants = (theme: ThemeStyle): DropdownListInputVariantsFunction =>
    defaultDropdownListInputStrategy.resolve(theme);
export const dropdownListAffixContainerThemeVariants = (
    theme: ThemeStyle
): DropdownListAffixContainerVariantsFunction => defaultDropdownListAffixContainerStrategy.resolve(theme);
export const dropdownListValueContainerThemeVariants = (
    theme: ThemeStyle
): DropdownListValueContainerVariantsFunction => defaultDropdownListValueContainerStrategy.resolve(theme);

export function createDropdownListStyleStrategy(
    overrides: readonly DropdownListStyleOverrides[] = []
): DropdownListStyleStrategy {
    const mona: DropdownListVariantsFunctions = {
        affixContainer: createDropdownListAffixContainerVariants(
            monaDropdownListAffixContainerVariants,
            overrides,
            "mona"
        ),
        input: createDropdownListInputVariants(monaDropdownListInputVariants, overrides, "mona"),
        valueContainer: createDropdownListValueContainerVariants(
            monaDropdownListValueContainerVariants,
            overrides,
            "mona"
        )
    };
    const reina: DropdownListVariantsFunctions = {
        affixContainer: createDropdownListAffixContainerVariants(
            reinaDropdownListAffixContainerVariants,
            overrides,
            "reina"
        ),
        input: createDropdownListInputVariants(reinaDropdownListInputVariants, overrides, "reina"),
        valueContainer: createDropdownListValueContainerVariants(
            reinaDropdownListValueContainerVariants,
            overrides,
            "reina"
        )
    };
    return createThemeStrategy<DropdownListVariantsFunctions>({ mona, reina }, mona);
}
