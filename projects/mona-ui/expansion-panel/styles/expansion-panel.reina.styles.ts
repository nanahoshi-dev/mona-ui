import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants
} from "./expansion-panel.mona.styles";

export const reinaExpansionPanelBaseVariants = createInheritedVariants(monaExpansionPanelBaseVariants, {
    add: "border-border/60",
    remove: "border-border",
    variants: {
        rounded: {
            small: {
                add: "rounded-md",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaExpansionPanelHeaderVariants = createInheritedVariants(monaExpansionPanelHeaderVariants, {
    add: "duration-150 ease-out focus-visible:outline-primary/35 focus-visible:ring-primary/35",
    remove: "duration-200 focus-visible:outline-primary/40 focus-visible:ring-primary/40",
    variants: {
        collapsed: {
            false: {
                add: "border-border/60",
                remove: "border-border"
            }
        },
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});

export const reinaExpansionPanelHeaderTitleVariants = createInheritedVariants(
    monaExpansionPanelHeaderTitleVariants,
    {}
);

export const reinaExpansionPanelIconContainerVariants = createInheritedVariants(
    monaExpansionPanelIconContainerVariants,
    {}
);

export const reinaExpansionPanelContentVariants = createInheritedVariants(monaExpansionPanelContentVariants, {});
