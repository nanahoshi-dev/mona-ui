import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListVariants as monaPagerListVariants,
    pagerListItemVariants as monaPagerListItemVariants
} from "./pager.mona.styles";

export const reinaPagerBaseVariants = createInheritedVariants(monaPagerBaseVariants, {
    add: "border-input-border",
    remove: "border-border"
});

export const reinaPagerInfoVariants = createInheritedVariants(monaPagerInfoVariants, {});

export const reinaPagerInputVariants = createInheritedVariants(monaPagerInputVariants, {});

export const reinaPagerListVariants = createInheritedVariants(monaPagerListVariants, {
    add: "gap-0.5"
});

export const reinaPagerListItemVariants = createInheritedVariants(monaPagerListItemVariants, {});
