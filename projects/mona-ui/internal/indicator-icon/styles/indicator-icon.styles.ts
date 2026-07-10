import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";

const indicatorIconHostThemeVariantsStrategy = createThemeStrategy(
    { mona: monaIndicatorIconHostVariants },
    monaIndicatorIconHostVariants
);

export const indicatorIconHostThemeVariants = (theme: ThemeStyle) =>
    indicatorIconHostThemeVariantsStrategy.resolve(theme);

const indicatorIconSvgThemeVariantsStrategy = createThemeStrategy(
    { mona: monaIndicatorIconSvgVariants },
    monaIndicatorIconSvgVariants
);

export const indicatorIconSvgThemeVariants = (theme: ThemeStyle) =>
    indicatorIconSvgThemeVariantsStrategy.resolve(theme);

type IndicatorIconHostVariantProps = VariantProps<ReturnType<typeof indicatorIconHostThemeVariants>>;
type IndicatorIconHostVariantInput = VariantInputs<IndicatorIconHostVariantProps>;

type IndicatorIconSvgVariantProps = VariantProps<ReturnType<typeof indicatorIconSvgThemeVariants>>;
type IndicatorIconSvgVariantInput = VariantInputs<IndicatorIconSvgVariantProps>;

export type IndicatorIconVariantProps = IndicatorIconHostVariantProps & IndicatorIconSvgVariantProps;
export type IndicatorIconVariantInput = IndicatorIconHostVariantInput & IndicatorIconSvgVariantInput;
