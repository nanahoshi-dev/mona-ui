import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants,
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants
} from "./multi-select.mona.styles";

export const reinaMultiSelectBaseVariants = createInheritedVariants(monaMultiSelectBaseVariants, {
    add: "bg-input-background focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary transition-[color,box-shadow,border,background-color] ease-out duration-150",
    remove: "bg-background focus-within:ring-1 focus-within:ring-primary/40 transition-[color,box-shadow,border] ease-in-out duration-300",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        focused: {
            true: {
                add: "ring-2 ring-primary/35 border-primary",
                remove: "ring-1 ring-primary/40"
            }
        },
        invalid: {
            true: {
                add: "ring-2 ring-error/35",
                remove: "ring-1 ring-error/40"
            }
        }
    }
});

export const reinaMultiSelectItemContainerVariants = createInheritedVariants(monaMultiSelectItemContainerVariants, {});

export const reinaMultiSelectAffixContainerVariants = createInheritedVariants(
    monaMultiSelectAffixContainerVariants,
    {}
);

export const reinaMultiSelectIndicatorContainerVariants = createInheritedVariants(
    monaMultiSelectIndicatorContainerVariants,
    {}
);
