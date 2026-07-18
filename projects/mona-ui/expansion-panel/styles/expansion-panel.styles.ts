import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    expansionPanelBaseVariants as annaExpansionPanelBaseVariants,
    expansionPanelContentVariants as annaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as annaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as annaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as annaExpansionPanelIconContainerVariants
} from "./expansion-panel.anna.styles";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";

export const expansionPanelBaseThemeVariants = createThemeStrategy({
    anna: annaExpansionPanelBaseVariants,
    mona: monaExpansionPanelBaseVariants
});

export const expansionPanelHeaderThemeVariants = createThemeStrategy({
    anna: annaExpansionPanelHeaderVariants,
    mona: monaExpansionPanelHeaderVariants
});

export const expansionPanelHeaderTitleThemeVariants = createThemeStrategy({
    anna: annaExpansionPanelHeaderTitleVariants,
    mona: monaExpansionPanelHeaderTitleVariants
});

export const expansionPanelIconContainerThemeVariants = createThemeStrategy({
    anna: annaExpansionPanelIconContainerVariants,
    mona: monaExpansionPanelIconContainerVariants
});

export const expansionPanelContentThemeVariants = createThemeStrategy({
    anna: annaExpansionPanelContentVariants,
    mona: monaExpansionPanelContentVariants
});
type ExpansionPanelBaseVariantProps = VariantProps<ReturnType<typeof expansionPanelBaseThemeVariants>>;
type ExpansionPanelBaseVariantInput = VariantInputs<ExpansionPanelBaseVariantProps>;
type ExpansionPanelHeaderVariantProps = VariantProps<ReturnType<typeof expansionPanelHeaderThemeVariants>>;
type ExpansionPanelHeaderVariantInput = VariantInputs<ExpansionPanelHeaderVariantProps>;
type ExpansionPanelContentVariantProps = VariantProps<ReturnType<typeof expansionPanelContentThemeVariants>>;
type ExpansionPanelContentVariantInput = VariantInputs<ExpansionPanelContentVariantProps>;
type ExpansionPanelIconContainerVariantProps = VariantProps<
    ReturnType<typeof expansionPanelIconContainerThemeVariants>
>;
type ExpansionPanelIconContainerVariantInput = VariantInputs<ExpansionPanelIconContainerVariantProps>;

export type ExpansionPanelVariantProps = ExpansionPanelBaseVariantProps &
    ExpansionPanelHeaderVariantProps &
    ExpansionPanelContentVariantProps &
    ExpansionPanelIconContainerVariantProps;
export type ExpansionPanelVariantInput = ExpansionPanelBaseVariantInput &
    Omit<ExpansionPanelHeaderVariantInput, "collapsed"> &
    ExpansionPanelContentVariantInput &
    Omit<ExpansionPanelIconContainerVariantInput, "hasTemplate">;
