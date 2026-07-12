import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants
} from "./time-selector.mona.styles";
import {
    reinaTimeSelectorBaseVariants,
    reinaTimeSelectorFooterVariants,
    reinaTimeSelectorHeaderVariants,
    reinaTimeSelectorInfoContainerVariants,
    reinaTimeSelectorListContainerVariants,
    reinaTimeSelectorListItemVariants,
    reinaTimeSelectorListVariants
} from "./time-selector.reina.styles";
import {
    createTimeSelectorBaseVariants,
    createTimeSelectorFooterVariants,
    createTimeSelectorHeaderVariants,
    createTimeSelectorInfoContainerVariants,
    createTimeSelectorListContainerVariants,
    createTimeSelectorListItemVariants,
    createTimeSelectorListVariants
} from "./time-selector.style-composition";
import type {
    TimeSelectorBaseVariantsFunction,
    TimeSelectorFooterVariantsFunction,
    TimeSelectorHeaderVariantsFunction,
    TimeSelectorInfoContainerVariantsFunction,
    TimeSelectorListContainerVariantsFunction,
    TimeSelectorListItemVariantsFunction,
    TimeSelectorListVariantsFunction,
    TimeSelectorStyleOverrides,
    TimeSelectorStyleStrategy,
    TimeSelectorVariantsFunctions
} from "./time-selector.types";

const defaultTimeSelectorBaseStrategy = createInheritedThemeStrategy<TimeSelectorBaseVariantsFunction>(
    monaTimeSelectorBaseVariants,
    { reina: reinaTimeSelectorBaseVariants }
);
const defaultTimeSelectorFooterStrategy = createInheritedThemeStrategy<TimeSelectorFooterVariantsFunction>(
    monaTimeSelectorFooterVariants,
    { reina: reinaTimeSelectorFooterVariants }
);
const defaultTimeSelectorHeaderStrategy = createInheritedThemeStrategy<TimeSelectorHeaderVariantsFunction>(
    monaTimeSelectorHeaderVariants,
    { reina: reinaTimeSelectorHeaderVariants }
);
const defaultTimeSelectorInfoContainerStrategy =
    createInheritedThemeStrategy<TimeSelectorInfoContainerVariantsFunction>(monaTimeSelectorInfoContainerVariants, {
        reina: reinaTimeSelectorInfoContainerVariants
    });
const defaultTimeSelectorListContainerStrategy =
    createInheritedThemeStrategy<TimeSelectorListContainerVariantsFunction>(monaTimeSelectorListContainerVariants, {
        reina: reinaTimeSelectorListContainerVariants
    });
const defaultTimeSelectorListStrategy = createInheritedThemeStrategy<TimeSelectorListVariantsFunction>(
    monaTimeSelectorListVariants,
    { reina: reinaTimeSelectorListVariants }
);
const defaultTimeSelectorListItemStrategy = createInheritedThemeStrategy<TimeSelectorListItemVariantsFunction>(
    monaTimeSelectorListItemVariants,
    { reina: reinaTimeSelectorListItemVariants }
);

export const timeSelectorBaseThemeVariants = (theme: ThemeStyle): TimeSelectorBaseVariantsFunction =>
    defaultTimeSelectorBaseStrategy.resolve(theme);
export const timeSelectorFooterThemeVariants = (theme: ThemeStyle): TimeSelectorFooterVariantsFunction =>
    defaultTimeSelectorFooterStrategy.resolve(theme);
export const timeSelectorHeaderThemeVariants = (theme: ThemeStyle): TimeSelectorHeaderVariantsFunction =>
    defaultTimeSelectorHeaderStrategy.resolve(theme);
export const timeSelectorInfoContainerThemeVariants = (theme: ThemeStyle): TimeSelectorInfoContainerVariantsFunction =>
    defaultTimeSelectorInfoContainerStrategy.resolve(theme);
export const timeSelectorListContainerThemeVariants = (theme: ThemeStyle): TimeSelectorListContainerVariantsFunction =>
    defaultTimeSelectorListContainerStrategy.resolve(theme);
export const timeSelectorListThemeVariants = (theme: ThemeStyle): TimeSelectorListVariantsFunction =>
    defaultTimeSelectorListStrategy.resolve(theme);
export const timeSelectorListItemThemeVariants = (theme: ThemeStyle): TimeSelectorListItemVariantsFunction =>
    defaultTimeSelectorListItemStrategy.resolve(theme);

export function createTimeSelectorStyleStrategy(
    overrides: readonly TimeSelectorStyleOverrides[] = []
): TimeSelectorStyleStrategy {
    const mona: TimeSelectorVariantsFunctions = {
        base: createTimeSelectorBaseVariants(monaTimeSelectorBaseVariants, overrides, "mona"),
        footer: createTimeSelectorFooterVariants(monaTimeSelectorFooterVariants, overrides, "mona"),
        header: createTimeSelectorHeaderVariants(monaTimeSelectorHeaderVariants, overrides, "mona"),
        infoContainer: createTimeSelectorInfoContainerVariants(
            monaTimeSelectorInfoContainerVariants,
            overrides,
            "mona"
        ),
        list: createTimeSelectorListVariants(monaTimeSelectorListVariants, overrides, "mona"),
        listContainer: createTimeSelectorListContainerVariants(
            monaTimeSelectorListContainerVariants,
            overrides,
            "mona"
        ),
        listItem: createTimeSelectorListItemVariants(monaTimeSelectorListItemVariants, overrides, "mona")
    };
    const reina: TimeSelectorVariantsFunctions = {
        base: createTimeSelectorBaseVariants(reinaTimeSelectorBaseVariants, overrides, "reina"),
        footer: createTimeSelectorFooterVariants(reinaTimeSelectorFooterVariants, overrides, "reina"),
        header: createTimeSelectorHeaderVariants(reinaTimeSelectorHeaderVariants, overrides, "reina"),
        infoContainer: createTimeSelectorInfoContainerVariants(
            reinaTimeSelectorInfoContainerVariants,
            overrides,
            "reina"
        ),
        list: createTimeSelectorListVariants(reinaTimeSelectorListVariants, overrides, "reina"),
        listContainer: createTimeSelectorListContainerVariants(
            reinaTimeSelectorListContainerVariants,
            overrides,
            "reina"
        ),
        listItem: createTimeSelectorListItemVariants(reinaTimeSelectorListItemVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<TimeSelectorVariantsFunctions>(mona, { reina: reina });
}
