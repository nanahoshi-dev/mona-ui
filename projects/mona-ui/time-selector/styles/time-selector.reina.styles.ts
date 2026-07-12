import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants
} from "./time-selector.mona.styles";

export const reinaTimeSelectorBaseVariants = createInheritedVariants(monaTimeSelectorBaseVariants, {
    add: "data-[invalid='true']:ring-error/35 transition-[box-shadow,border] ease-out duration-150",
    remove: "data-[invalid='true']:ring-error/40",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});

export const reinaTimeSelectorFooterVariants = createInheritedVariants(monaTimeSelectorFooterVariants, {});

export const reinaTimeSelectorHeaderVariants = createInheritedVariants(monaTimeSelectorHeaderVariants, {});

export const reinaTimeSelectorInfoContainerVariants = createInheritedVariants(
    monaTimeSelectorInfoContainerVariants,
    {}
);

export const reinaTimeSelectorListContainerVariants = createInheritedVariants(
    monaTimeSelectorListContainerVariants,
    {}
);

export const reinaTimeSelectorListVariants = createInheritedVariants(monaTimeSelectorListVariants, {});

export const reinaTimeSelectorListItemVariants = createInheritedVariants(monaTimeSelectorListItemVariants, {});
