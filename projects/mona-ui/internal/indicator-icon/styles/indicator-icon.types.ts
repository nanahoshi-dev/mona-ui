import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    indicatorIconHostVariants as monaIndicatorIconHostVariants,
    indicatorIconSvgVariants as monaIndicatorIconSvgVariants
} from "./indicator-icon.mona.styles";

export type IndicatorIconHostVariantsFunction = (props?: IndicatorIconHostVariantProps) => string;
export type IndicatorIconHostVariantProps = VariantProps<typeof monaIndicatorIconHostVariants>;

export type IndicatorIconSvgVariantsFunction = (props?: IndicatorIconSvgVariantProps) => string;
export type IndicatorIconSvgVariantProps = VariantProps<typeof monaIndicatorIconSvgVariants>;

export interface IndicatorIconVariantsFunctions {
    readonly host: IndicatorIconHostVariantsFunction;
    readonly svg: IndicatorIconSvgVariantsFunction;
}

export type IndicatorIconStyleStrategy = ThemeStrategy<IndicatorIconVariantsFunctions>;

export interface IndicatorIconHostStyleOverrides {
    readonly base?: ClassValue;
    readonly interactive?: Partial<Record<"true" | "false", ClassValue>>;
    readonly preset?: Partial<Record<NonNullable<IndicatorIconHostVariantProps["preset"]>, ClassValue>>;
}

export interface IndicatorIconSvgStyleOverrides {
    readonly base?: ClassValue;
    readonly loading?: Partial<Record<"true" | "false", ClassValue>>;
}

export interface IndicatorIconStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly host?: IndicatorIconHostStyleOverrides;
    readonly svg?: IndicatorIconSvgStyleOverrides;
}

export type IndicatorIconStylesProviderConfig =
    | IndicatorIconStyleOverrides
    | { readonly strategy: IndicatorIconStyleStrategy };
