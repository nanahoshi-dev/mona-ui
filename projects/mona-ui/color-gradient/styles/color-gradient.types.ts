import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";

export type ColorGradientBaseVariantsFunction = (props?: ColorGradientBaseVariantProps) => string;
export type ColorGradientBaseVariantProps = VariantProps<typeof monaColorGradientBaseVariants>;

export type ColorGradientHsvRectangleVariantsFunction = (props?: ColorGradientHsvRectangleVariantProps) => string;
export type ColorGradientHsvRectangleVariantProps = VariantProps<typeof monaColorGradientHsvRectangleVariants>;

export type ColorGradientHsvRectangleHandleVariantsFunction = (
    props?: ColorGradientHsvRectangleHandleVariantProps
) => string;
export type ColorGradientHsvRectangleHandleVariantProps = VariantProps<
    typeof monaColorGradientHsvRectangleHandleVariants
>;

export type ColorGradientPreviewVariantsFunction = (props?: ColorGradientPreviewVariantProps) => string;
export type ColorGradientPreviewVariantProps = VariantProps<typeof monaColorGradientPreviewVariants>;

export type ColorGradientSliderHandleVariantsFunction = (props?: ColorGradientSliderHandleVariantProps) => string;
export type ColorGradientSliderHandleVariantProps = VariantProps<typeof monaColorGradientSliderHandleVariants>;

export type ColorGradientBaseVariantInput = VariantInputs<ColorGradientBaseVariantProps>;
export type ColorGradientHsvRectangleVariantInput = VariantInputs<ColorGradientHsvRectangleVariantProps>;
export type ColorGradientHsvRectangleHandleVariantInput = VariantInputs<ColorGradientHsvRectangleHandleVariantProps>;
export type ColorGradientPreviewVariantInput = VariantInputs<ColorGradientPreviewVariantProps>;
export type ColorGradientSliderHandleVariantInput = VariantInputs<ColorGradientSliderHandleVariantProps>;

export type ColorGradientVariantProps = ColorGradientBaseVariantProps &
    ColorGradientHsvRectangleVariantProps &
    ColorGradientHsvRectangleHandleVariantProps &
    ColorGradientPreviewVariantProps &
    ColorGradientSliderHandleVariantProps;

export type ColorGradientVariantInputs = ColorGradientBaseVariantInput &
    ColorGradientHsvRectangleVariantInput &
    ColorGradientHsvRectangleHandleVariantInput &
    ColorGradientPreviewVariantInput &
    ColorGradientSliderHandleVariantInput;

export interface ColorGradientVariantsFunctions {
    readonly base: ColorGradientBaseVariantsFunction;
    readonly hsvRectangle: ColorGradientHsvRectangleVariantsFunction;
    readonly hsvRectangleHandle: ColorGradientHsvRectangleHandleVariantsFunction;
    readonly preview: ColorGradientPreviewVariantsFunction;
    readonly sliderHandle: ColorGradientSliderHandleVariantsFunction;
}

export type ColorGradientStyleStrategy = ThemeStrategy<ColorGradientVariantsFunctions>;

export interface ColorGradientBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface ColorGradientHsvRectangleStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ColorGradientHsvRectangleVariantProps["rounded"]>, ClassValue>>;
}

export interface ColorGradientHsvRectangleHandleStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<
        Record<NonNullable<ColorGradientHsvRectangleHandleVariantProps["rounded"]>, ClassValue>
    >;
}

export interface ColorGradientPreviewStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ColorGradientPreviewVariantProps["rounded"]>, ClassValue>>;
}

export interface ColorGradientSliderHandleStyleOverrides {
    readonly base?: ClassValue;
}

export interface ColorGradientStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ColorGradientBaseStyleOverrides;
    readonly hsvRectangle?: ColorGradientHsvRectangleStyleOverrides;
    readonly hsvRectangleHandle?: ColorGradientHsvRectangleHandleStyleOverrides;
    readonly preview?: ColorGradientPreviewStyleOverrides;
    readonly sliderHandle?: ColorGradientSliderHandleStyleOverrides;
}

export type ColorGradientStylesProviderConfig =
    | ColorGradientStyleOverrides
    | { readonly strategy: ColorGradientStyleStrategy };
