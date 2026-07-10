import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    tooltipArrowVariants as monaTooltipArrowVariants,
    tooltipBaseVariants as monaTooltipVariants
} from "./tooltip.mona.styles";

const tooltipBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaTooltipVariants }, monaTooltipVariants);

export const tooltipBaseThemeVariants = (theme: ThemeStyle) => tooltipBaseThemeVariantsStrategy.resolve(theme);

const tooltipArrowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTooltipArrowVariants },
    monaTooltipArrowVariants
);

export const tooltipArrowThemeVariants = (theme: ThemeStyle) => tooltipArrowThemeVariantsStrategy.resolve(theme);

type TooltipBaseVariantProps = VariantProps<ReturnType<typeof tooltipBaseThemeVariants>>;
type TooltipBaseVariantInputs = VariantInputs<TooltipBaseVariantProps>;

type TooltipArrowVariantsProps = VariantProps<ReturnType<typeof tooltipArrowThemeVariants>>;
type TooltipArrowVariantsInputs = VariantInputs<TooltipArrowVariantsProps>;

export type TooltipVariantProps = TooltipBaseVariantProps & TooltipArrowVariantsProps;
export type TooltipVariantInputs = TooltipBaseVariantInputs & TooltipArrowVariantsInputs;
