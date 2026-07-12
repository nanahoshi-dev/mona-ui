import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants,
    popoverContentVariants as monaPopoverContentVariants
} from "./popover.mona.styles";

export const reinaPopoverBaseVariants = createInheritedVariants(monaPopoverBaseVariants, {
    add: "border-border/60 shadow-lg",
    remove: "border-border shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
    variants: {
        rounded: {
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            }
        }
    }
});

export const reinaPopoverHeaderVariants = createInheritedVariants(monaPopoverHeaderVariants, {
    add: "border-b border-border/60",
    variants: {
        rounded: {
            large: {
                add: "rounded-t-2xl",
                remove: "rounded-t-lg"
            },
            medium: {
                add: "rounded-t-xl",
                remove: "rounded-t-md"
            },
            small: {
                add: "rounded-t-lg",
                remove: "rounded-t-sm"
            }
        }
    }
});

export const reinaPopoverContentVariants = createInheritedVariants(monaPopoverContentVariants, {});
