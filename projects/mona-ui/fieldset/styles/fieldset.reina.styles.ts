import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetVariants as monaFieldsetVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants
} from "./fieldset.mona.styles";

export const reinaFieldsetBaseVariants = createInheritedVariants(monaFieldsetBaseVariants, {});

export const reinaFieldsetVariants = createInheritedVariants(monaFieldsetVariants, {
    add: "border-border/60 shadow-xs",
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
        },
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});

export const reinaFieldsetLegendVariants = createInheritedVariants(monaFieldsetLegendVariants, {
    add: "ml-3 font-medium",
    remove: "ml-2",
    variants: {
        hasTemplate: {
            false: {
                add: "text-foreground/70 border-border/60 px-2.5 text-xs tracking-wide",
                remove: "text-foreground border-border px-2"
            }
        },
        rounded: {
            small: {
                add: "rounded",
                remove: "rounded-sm"
            }
        }
    }
});
