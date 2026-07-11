import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    tooltipArrowVariants as monaTooltipArrowVariants,
    tooltipBaseVariants as monaTooltipBaseVariants
} from "./tooltip.mona.styles";
import { reinaTooltipArrowVariants, reinaTooltipBaseVariants } from "./tooltip.reina.styles";
import { createTooltipArrowVariants, createTooltipBaseVariants } from "./tooltip.style-composition";
import type {
    TooltipArrowVariantsFunction,
    TooltipBaseVariantsFunction,
    TooltipStyleOverrides,
    TooltipStyleStrategy,
    TooltipVariantsFunctions
} from "./tooltip.types";

const defaultTooltipBaseStrategy = createThemeStrategy<TooltipBaseVariantsFunction>(
    { mona: monaTooltipBaseVariants, reina: reinaTooltipBaseVariants },
    monaTooltipBaseVariants
);
const defaultTooltipArrowStrategy = createThemeStrategy<TooltipArrowVariantsFunction>(
    { mona: monaTooltipArrowVariants, reina: reinaTooltipArrowVariants },
    monaTooltipArrowVariants
);

export const tooltipBaseThemeVariants = (theme: ThemeStyle): TooltipBaseVariantsFunction =>
    defaultTooltipBaseStrategy.resolve(theme);

export const tooltipArrowThemeVariants = (theme: ThemeStyle): TooltipArrowVariantsFunction =>
    defaultTooltipArrowStrategy.resolve(theme);

export function createTooltipStyleStrategy(overrides: readonly TooltipStyleOverrides[] = []): TooltipStyleStrategy {
    const mona: TooltipVariantsFunctions = {
        base: createTooltipBaseVariants(monaTooltipBaseVariants, overrides, "mona"),
        arrow: createTooltipArrowVariants(monaTooltipArrowVariants, overrides, "mona")
    };
    const reina: TooltipVariantsFunctions = {
        base: createTooltipBaseVariants(reinaTooltipBaseVariants, overrides, "reina"),
        arrow: createTooltipArrowVariants(reinaTooltipArrowVariants, overrides, "reina")
    };
    return createThemeStrategy<TooltipVariantsFunctions>({ mona, reina }, mona);
}
