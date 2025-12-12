import { ThemeStyle } from "../../../theme/models/Theme";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";
import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "../../../utils/VariantInputs";

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
