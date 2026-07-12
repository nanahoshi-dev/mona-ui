import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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

const defaultExpansionPanelBaseStrategy = createInheritedThemeStrategy<ExpansionPanelBaseVariantsFunction>(
    monaExpansionPanelBaseVariants,
    { reina: reinaExpansionPanelBaseVariants }
);
const defaultExpansionPanelHeaderStrategy = createInheritedThemeStrategy<ExpansionPanelHeaderVariantsFunction>(
    monaExpansionPanelHeaderVariants,
    { reina: reinaExpansionPanelHeaderVariants }
);
const defaultExpansionPanelHeaderTitleStrategy =
    createInheritedThemeStrategy<ExpansionPanelHeaderTitleVariantsFunction>(monaExpansionPanelHeaderTitleVariants, {
        reina: reinaExpansionPanelHeaderTitleVariants
    });
const defaultExpansionPanelIconContainerStrategy =
    createInheritedThemeStrategy<ExpansionPanelIconContainerVariantsFunction>(monaExpansionPanelIconContainerVariants, {
        reina: reinaExpansionPanelIconContainerVariants
    });
const defaultExpansionPanelContentStrategy = createInheritedThemeStrategy<ExpansionPanelContentVariantsFunction>(
    monaExpansionPanelContentVariants,
    { reina: reinaExpansionPanelContentVariants }
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
    return createInheritedThemeStrategy<ExpansionPanelVariantsFunctions>(mona, { reina: reina });
}
