import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";

export const indicatorIconHostThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaIndicatorIconHostVariants;
        default:
            return monaIndicatorIconHostVariants;
    }
};

export const indicatorIconSvgThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaIndicatorIconSvgVariants;
        default:
            return monaIndicatorIconSvgVariants;
    }
};

type IndicatorIconHostVariantProps = VariantProps<ReturnType<typeof indicatorIconHostThemeVariants>>;
type IndicatorIconHostVariantInput = VariantInputs<IndicatorIconHostVariantProps>;

type IndicatorIconSvgVariantProps = VariantProps<ReturnType<typeof indicatorIconSvgThemeVariants>>;
type IndicatorIconSvgVariantInput = VariantInputs<IndicatorIconSvgVariantProps>;

export type IndicatorIconVariantProps = IndicatorIconHostVariantProps & IndicatorIconSvgVariantProps;
export type IndicatorIconVariantInput = IndicatorIconHostVariantInput & IndicatorIconSvgVariantInput;
