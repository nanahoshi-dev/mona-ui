import { ThemeStyle } from "../../../theme/models/Theme";
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
