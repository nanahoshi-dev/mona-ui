import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    indicatorIconHostVariants as annaIndicatorIconHostVariants,
    indicatorIconSvgVariants as annaIndicatorIconSvgVariants
} from "./indicator-icon.anna.styles";
import {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";

export const indicatorIconHostThemeVariants = createThemeStrategy({
    anna: annaIndicatorIconHostVariants,
    mona: monaIndicatorIconHostVariants
});

export const indicatorIconSvgThemeVariants = createThemeStrategy({
    anna: annaIndicatorIconSvgVariants,
    mona: monaIndicatorIconSvgVariants
});

type IndicatorIconHostVariantProps = VariantProps<ReturnType<typeof indicatorIconHostThemeVariants>>;
type IndicatorIconHostVariantInput = VariantInputs<IndicatorIconHostVariantProps>;

type IndicatorIconSvgVariantProps = VariantProps<ReturnType<typeof indicatorIconSvgThemeVariants>>;
type IndicatorIconSvgVariantInput = VariantInputs<IndicatorIconSvgVariantProps>;

export type IndicatorIconVariantProps = IndicatorIconHostVariantProps & IndicatorIconSvgVariantProps;
export type IndicatorIconVariantInput = IndicatorIconHostVariantInput & IndicatorIconSvgVariantInput;
