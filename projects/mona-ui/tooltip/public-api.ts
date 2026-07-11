/*
 * Public API Surface of @nanahoshi/mona-ui/tooltip
 */

export * from "./components/tooltip/tooltip.component";
export * from "./directives/tooltip.directive";

export {
    createTooltipStyleStrategy,
    provideTooltipStyles,
    tooltipArrowThemeVariants,
    TOOLTIP_STYLE_OVERRIDES,
    TOOLTIP_STYLE_STRATEGY
} from "./styles/tooltip.styles";
export type {
    TooltipArrowStyleOverrides,
    TooltipArrowVariantInputs,
    TooltipArrowVariantProps,
    TooltipBaseCompoundStyleOverride,
    TooltipBaseStyleOverrides,
    TooltipBaseVariantInputs,
    TooltipBaseVariantProps,
    TooltipStyleOverrides,
    TooltipStylesProviderConfig,
    TooltipStyleStrategy,
    TooltipVariantInputs,
    TooltipVariantProps,
    TooltipVariantsFunctions
} from "./styles/tooltip.styles";

export { getOffsetForPosition, getPositionConnectionPoints } from "./utils/tooltip.utils";
