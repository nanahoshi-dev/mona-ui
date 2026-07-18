import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    tooltipArrowVariants as annaTooltipArrowVariants,
    tooltipBaseVariants as annaTooltipVariants
} from "./tooltip.anna.styles";
import {
    tooltipArrowVariants as monaTooltipArrowVariants,
    tooltipBaseVariants as monaTooltipVariants
} from "./tooltip.mona.styles";

export const tooltipBaseThemeVariants = createThemeStrategy({
    anna: annaTooltipVariants,
    mona: monaTooltipVariants
});

export const tooltipArrowThemeVariants = createThemeStrategy({
    anna: annaTooltipArrowVariants,
    mona: monaTooltipArrowVariants
});

type TooltipBaseVariantProps = VariantProps<ReturnType<typeof tooltipBaseThemeVariants>>;
type TooltipBaseVariantInputs = VariantInputs<TooltipBaseVariantProps>;

type TooltipArrowVariantsProps = VariantProps<ReturnType<typeof tooltipArrowThemeVariants>>;
type TooltipArrowVariantsInputs = VariantInputs<TooltipArrowVariantsProps>;

export type TooltipVariantProps = TooltipBaseVariantProps & TooltipArrowVariantsProps;
export type TooltipVariantInputs = TooltipBaseVariantInputs & TooltipArrowVariantsInputs;
