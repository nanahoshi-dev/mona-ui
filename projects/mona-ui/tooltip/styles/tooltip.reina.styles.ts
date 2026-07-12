import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    tooltipBaseVariants as monaTooltipBaseVariants,
    tooltipArrowVariants as monaTooltipArrowVariants
} from "./tooltip.mona.styles";

export const reinaTooltipBaseVariants = createInheritedVariants(monaTooltipBaseVariants, {
    add: "border-border/60 font-medium text-sm shadow-lg",
    remove: "border-border shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
    variants: {
        rounded: {
            large: {
                add: "rounded-xl",
                remove: "rounded-lg"
            },
            medium: {
                add: "rounded-lg",
                remove: "rounded-md"
            },
            small: {
                add: "rounded-md",
                remove: "rounded-sm"
            }
        }
    }
});

export const reinaTooltipArrowVariants = createInheritedVariants(monaTooltipArrowVariants, {
    add: "border-border/60",
    remove: "border-border"
});
