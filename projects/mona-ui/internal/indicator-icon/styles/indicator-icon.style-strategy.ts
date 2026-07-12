import { createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";
import { reinaIndicatorIconHostVariants, reinaIndicatorIconSvgVariants } from "./indicator-icon.reina.styles";
import { createIndicatorIconHostVariants, createIndicatorIconSvgVariants } from "./indicator-icon.style-composition";
import type {
    IndicatorIconStyleOverrides,
    IndicatorIconStyleStrategy,
    IndicatorIconVariantsFunctions
} from "./indicator-icon.types";

export function createIndicatorIconStyleStrategy(
    overrides: readonly IndicatorIconStyleOverrides[] = []
): IndicatorIconStyleStrategy {
    const mona: IndicatorIconVariantsFunctions = {
        host: createIndicatorIconHostVariants(monaIndicatorIconHostVariants, overrides, "mona"),
        svg: createIndicatorIconSvgVariants(monaIndicatorIconSvgVariants, overrides, "mona")
    };
    const reina: IndicatorIconVariantsFunctions = {
        host: createIndicatorIconHostVariants(reinaIndicatorIconHostVariants, overrides, "reina"),
        svg: createIndicatorIconSvgVariants(reinaIndicatorIconSvgVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<IndicatorIconVariantsFunctions>(mona, { reina: reina });
}
