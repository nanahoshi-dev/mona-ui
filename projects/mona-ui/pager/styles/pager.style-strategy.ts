import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListItemVariants as monaPagerListItemVariants,
    pagerListVariants as monaPagerListVariants
} from "./pager.mona.styles";
import {
    reinaPagerBaseVariants,
    reinaPagerInfoVariants,
    reinaPagerInputVariants,
    reinaPagerListItemVariants,
    reinaPagerListVariants
} from "./pager.reina.styles";
import {
    createPagerBaseVariants,
    createPagerInfoVariants,
    createPagerInputVariants,
    createPagerListItemVariants,
    createPagerListVariants
} from "./pager.style-composition";
import type { PagerStyleOverrides, PagerStyleStrategy, PagerVariantsFunctions } from "./pager.types";

export function createPagerStyleStrategy(overrides: readonly PagerStyleOverrides[] = []): PagerStyleStrategy {
    const mona: PagerVariantsFunctions = {
        base: createPagerBaseVariants(monaPagerBaseVariants, overrides, "mona"),
        info: createPagerInfoVariants(monaPagerInfoVariants, overrides, "mona"),
        input: createPagerInputVariants(monaPagerInputVariants, overrides, "mona"),
        list: createPagerListVariants(monaPagerListVariants, overrides, "mona"),
        listItem: createPagerListItemVariants(monaPagerListItemVariants, overrides, "mona")
    };
    const reina: PagerVariantsFunctions = {
        base: createPagerBaseVariants(reinaPagerBaseVariants, overrides, "reina"),
        info: createPagerInfoVariants(reinaPagerInfoVariants, overrides, "reina"),
        input: createPagerInputVariants(reinaPagerInputVariants, overrides, "reina"),
        list: createPagerListVariants(reinaPagerListVariants, overrides, "reina"),
        listItem: createPagerListItemVariants(reinaPagerListItemVariants, overrides, "reina")
    };
    return createThemeStrategy<PagerVariantsFunctions>({ mona, reina }, mona);
}
