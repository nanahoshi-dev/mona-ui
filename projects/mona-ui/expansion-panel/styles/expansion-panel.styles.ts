import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";

export const expansionPanelBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaExpansionPanelBaseVariants;
        default:
            return monaExpansionPanelBaseVariants;
    }
};

export const expansionPanelHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaExpansionPanelHeaderVariants;
        default:
            return monaExpansionPanelHeaderVariants;
    }
};

export const expansionPanelHeaderTitleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaExpansionPanelHeaderTitleVariants;
        default:
            return monaExpansionPanelHeaderTitleVariants;
    }
};

export const expansionPanelIconContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaExpansionPanelIconContainerVariants;
        default:
            return monaExpansionPanelIconContainerVariants;
    }
};

export const expansionPanelContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaExpansionPanelContentVariants;
        default:
            return monaExpansionPanelContentVariants;
    }
};
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
