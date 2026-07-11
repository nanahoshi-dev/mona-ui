import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";
import {
    reinaExpansionPanelBaseVariants,
    reinaExpansionPanelContentVariants,
    reinaExpansionPanelHeaderTitleVariants,
    reinaExpansionPanelHeaderVariants,
    reinaExpansionPanelIconContainerVariants
} from "./expansion-panel.reina.styles";
import {
    createExpansionPanelBaseVariants,
    createExpansionPanelContentVariants,
    createExpansionPanelHeaderTitleVariants,
    createExpansionPanelHeaderVariants,
    createExpansionPanelIconContainerVariants
} from "./expansion-panel.style-composition";
import type {
    ExpansionPanelBaseVariantsFunction,
    ExpansionPanelContentVariantsFunction,
    ExpansionPanelHeaderTitleVariantsFunction,
    ExpansionPanelHeaderVariantsFunction,
    ExpansionPanelIconContainerVariantsFunction,
    ExpansionPanelStyleOverrides,
    ExpansionPanelStyleStrategy,
    ExpansionPanelVariantsFunctions
} from "./expansion-panel.types";

const defaultExpansionPanelBaseStrategy = createThemeStrategy<ExpansionPanelBaseVariantsFunction>(
    { mona: monaExpansionPanelBaseVariants, reina: reinaExpansionPanelBaseVariants },
    monaExpansionPanelBaseVariants
);
const defaultExpansionPanelHeaderStrategy = createThemeStrategy<ExpansionPanelHeaderVariantsFunction>(
    { mona: monaExpansionPanelHeaderVariants, reina: reinaExpansionPanelHeaderVariants },
    monaExpansionPanelHeaderVariants
);
const defaultExpansionPanelHeaderTitleStrategy = createThemeStrategy<ExpansionPanelHeaderTitleVariantsFunction>(
    { mona: monaExpansionPanelHeaderTitleVariants, reina: reinaExpansionPanelHeaderTitleVariants },
    monaExpansionPanelHeaderTitleVariants
);
const defaultExpansionPanelIconContainerStrategy = createThemeStrategy<ExpansionPanelIconContainerVariantsFunction>(
    { mona: monaExpansionPanelIconContainerVariants, reina: reinaExpansionPanelIconContainerVariants },
    monaExpansionPanelIconContainerVariants
);
const defaultExpansionPanelContentStrategy = createThemeStrategy<ExpansionPanelContentVariantsFunction>(
    { mona: monaExpansionPanelContentVariants, reina: reinaExpansionPanelContentVariants },
    monaExpansionPanelContentVariants
);

export const expansionPanelBaseThemeVariants = (theme: ThemeStyle): ExpansionPanelBaseVariantsFunction =>
    defaultExpansionPanelBaseStrategy.resolve(theme);
export const expansionPanelHeaderThemeVariants = (theme: ThemeStyle): ExpansionPanelHeaderVariantsFunction =>
    defaultExpansionPanelHeaderStrategy.resolve(theme);
export const expansionPanelHeaderTitleThemeVariants = (theme: ThemeStyle): ExpansionPanelHeaderTitleVariantsFunction =>
    defaultExpansionPanelHeaderTitleStrategy.resolve(theme);
export const expansionPanelIconContainerThemeVariants = (
    theme: ThemeStyle
): ExpansionPanelIconContainerVariantsFunction => defaultExpansionPanelIconContainerStrategy.resolve(theme);
export const expansionPanelContentThemeVariants = (theme: ThemeStyle): ExpansionPanelContentVariantsFunction =>
    defaultExpansionPanelContentStrategy.resolve(theme);

export function createExpansionPanelStyleStrategy(
    overrides: readonly ExpansionPanelStyleOverrides[] = []
): ExpansionPanelStyleStrategy {
    const mona: ExpansionPanelVariantsFunctions = {
        base: createExpansionPanelBaseVariants(monaExpansionPanelBaseVariants, overrides, "mona"),
        content: createExpansionPanelContentVariants(monaExpansionPanelContentVariants, overrides, "mona"),
        header: createExpansionPanelHeaderVariants(monaExpansionPanelHeaderVariants, overrides, "mona"),
        headerTitle: createExpansionPanelHeaderTitleVariants(monaExpansionPanelHeaderTitleVariants, overrides, "mona"),
        iconContainer: createExpansionPanelIconContainerVariants(
            monaExpansionPanelIconContainerVariants,
            overrides,
            "mona"
        )
    };
    const reina: ExpansionPanelVariantsFunctions = {
        base: createExpansionPanelBaseVariants(reinaExpansionPanelBaseVariants, overrides, "reina"),
        content: createExpansionPanelContentVariants(reinaExpansionPanelContentVariants, overrides, "reina"),
        header: createExpansionPanelHeaderVariants(reinaExpansionPanelHeaderVariants, overrides, "reina"),
        headerTitle: createExpansionPanelHeaderTitleVariants(
            reinaExpansionPanelHeaderTitleVariants,
            overrides,
            "reina"
        ),
        iconContainer: createExpansionPanelIconContainerVariants(
            reinaExpansionPanelIconContainerVariants,
            overrides,
            "reina"
        )
    };
    return createThemeStrategy<ExpansionPanelVariantsFunctions>({ mona, reina }, mona);
}
