import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";

export const reinaIndicatorIconHostVariants = createInheritedVariants(monaIndicatorIconHostVariants, {
    add: "transition-opacity duration-150 ease-out",
    variants: {
        interactive: {
            true: {
                add: "focus:ring-primary/35",
                remove: "focus:ring-primary/40"
            }
        }
    }
});

export const reinaIndicatorIconSvgVariants = createInheritedVariants(monaIndicatorIconSvgVariants, {});
