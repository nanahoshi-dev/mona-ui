import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    tooltipArrowVariants as monaTooltipArrowVariants,
    tooltipBaseVariants as monaTooltipVariants
} from "./tooltip.mona.styles";

export const tooltipBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTooltipVariants;
        default:
            return monaTooltipVariants;
    }
};

export const tooltipArrowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTooltipArrowVariants;
        default:
            return monaTooltipArrowVariants;
    }
};

type TooltipBaseVariantProps = VariantProps<ReturnType<typeof tooltipBaseThemeVariants>>;
type TooltipBaseVariantInputs = VariantInputs<TooltipBaseVariantProps>;

type TooltipArrowVariantsProps = VariantProps<ReturnType<typeof tooltipArrowThemeVariants>>;
type TooltipArrowVariantsInputs = VariantInputs<TooltipArrowVariantsProps>;

export type TooltipVariantProps = TooltipBaseVariantProps & TooltipArrowVariantsProps;
export type TooltipVariantInputs = TooltipBaseVariantInputs & TooltipArrowVariantsInputs;
