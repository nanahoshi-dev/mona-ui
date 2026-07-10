import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";

const expansionPanelBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaExpansionPanelBaseVariants },
    monaExpansionPanelBaseVariants
);

export const expansionPanelBaseThemeVariants = (theme: ThemeStyle) =>
    expansionPanelBaseThemeVariantsStrategy.resolve(theme);

const expansionPanelHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaExpansionPanelHeaderVariants },
    monaExpansionPanelHeaderVariants
);

export const expansionPanelHeaderThemeVariants = (theme: ThemeStyle) =>
    expansionPanelHeaderThemeVariantsStrategy.resolve(theme);

const expansionPanelHeaderTitleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaExpansionPanelHeaderTitleVariants },
    monaExpansionPanelHeaderTitleVariants
);

export const expansionPanelHeaderTitleThemeVariants = (theme: ThemeStyle) =>
    expansionPanelHeaderTitleThemeVariantsStrategy.resolve(theme);

const expansionPanelIconContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaExpansionPanelIconContainerVariants },
    monaExpansionPanelIconContainerVariants
);

export const expansionPanelIconContainerThemeVariants = (theme: ThemeStyle) =>
    expansionPanelIconContainerThemeVariantsStrategy.resolve(theme);

const expansionPanelContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaExpansionPanelContentVariants },
    monaExpansionPanelContentVariants
);

export const expansionPanelContentThemeVariants = (theme: ThemeStyle) =>
    expansionPanelContentThemeVariantsStrategy.resolve(theme);
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
