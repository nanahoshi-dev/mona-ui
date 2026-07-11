import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants
} from "./multi-select.mona.styles";
import {
    reinaMultiSelectAffixContainerVariants,
    reinaMultiSelectBaseVariants,
    reinaMultiSelectIndicatorContainerVariants,
    reinaMultiSelectItemContainerVariants
} from "./multi-select.reina.styles";
import {
    createMultiSelectAffixContainerVariants,
    createMultiSelectBaseVariants,
    createMultiSelectIndicatorContainerVariants,
    createMultiSelectItemContainerVariants
} from "./multi-select.style-composition";
import type {
    MultiSelectAffixContainerVariantsFunction,
    MultiSelectBaseVariantsFunction,
    MultiSelectIndicatorContainerVariantsFunction,
    MultiSelectItemContainerVariantsFunction,
    MultiSelectStyleOverrides,
    MultiSelectStyleStrategy,
    MultiSelectVariantsFunctions
} from "./multi-select.types";

const defaultMultiSelectBaseStrategy = createThemeStrategy<MultiSelectBaseVariantsFunction>(
    { mona: monaMultiSelectBaseVariants, reina: reinaMultiSelectBaseVariants },
    monaMultiSelectBaseVariants
);
const defaultMultiSelectItemContainerStrategy = createThemeStrategy<MultiSelectItemContainerVariantsFunction>(
    { mona: monaMultiSelectItemContainerVariants, reina: reinaMultiSelectItemContainerVariants },
    monaMultiSelectItemContainerVariants
);
const defaultMultiSelectAffixContainerStrategy = createThemeStrategy<MultiSelectAffixContainerVariantsFunction>(
    { mona: monaMultiSelectAffixContainerVariants, reina: reinaMultiSelectAffixContainerVariants },
    monaMultiSelectAffixContainerVariants
);
const defaultMultiSelectIndicatorContainerStrategy = createThemeStrategy<MultiSelectIndicatorContainerVariantsFunction>(
    { mona: monaMultiSelectIndicatorContainerVariants, reina: reinaMultiSelectIndicatorContainerVariants },
    monaMultiSelectIndicatorContainerVariants
);

export const multiSelectBaseThemeVariants = (theme: ThemeStyle): MultiSelectBaseVariantsFunction =>
    defaultMultiSelectBaseStrategy.resolve(theme);
export const multiSelectItemContainerThemeVariants = (theme: ThemeStyle): MultiSelectItemContainerVariantsFunction =>
    defaultMultiSelectItemContainerStrategy.resolve(theme);
export const multiSelectAffixContainerThemeVariants = (theme: ThemeStyle): MultiSelectAffixContainerVariantsFunction =>
    defaultMultiSelectAffixContainerStrategy.resolve(theme);
export const multiSelectIndicatorContainerThemeVariants = (
    theme: ThemeStyle
): MultiSelectIndicatorContainerVariantsFunction => defaultMultiSelectIndicatorContainerStrategy.resolve(theme);

export function createMultiSelectStyleStrategy(
    overrides: readonly MultiSelectStyleOverrides[] = []
): MultiSelectStyleStrategy {
    const mona: MultiSelectVariantsFunctions = {
        affixContainer: createMultiSelectAffixContainerVariants(
            monaMultiSelectAffixContainerVariants,
            overrides,
            "mona"
        ),
        base: createMultiSelectBaseVariants(monaMultiSelectBaseVariants, overrides, "mona"),
        indicatorContainer: createMultiSelectIndicatorContainerVariants(
            monaMultiSelectIndicatorContainerVariants,
            overrides,
            "mona"
        ),
        itemContainer: createMultiSelectItemContainerVariants(monaMultiSelectItemContainerVariants, overrides, "mona")
    };
    const reina: MultiSelectVariantsFunctions = {
        affixContainer: createMultiSelectAffixContainerVariants(
            reinaMultiSelectAffixContainerVariants,
            overrides,
            "reina"
        ),
        base: createMultiSelectBaseVariants(reinaMultiSelectBaseVariants, overrides, "reina"),
        indicatorContainer: createMultiSelectIndicatorContainerVariants(
            reinaMultiSelectIndicatorContainerVariants,
            overrides,
            "reina"
        ),
        itemContainer: createMultiSelectItemContainerVariants(
            reinaMultiSelectItemContainerVariants,
            overrides,
            "reina"
        )
    };
    return createThemeStrategy<MultiSelectVariantsFunctions>({ mona, reina }, mona);
}
