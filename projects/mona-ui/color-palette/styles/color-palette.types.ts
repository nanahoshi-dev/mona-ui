import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";

export type ColorPaletteBaseVariantsFunction = (props?: ColorPaletteBaseVariantProps) => string;
export type ColorPaletteBaseVariantProps = VariantProps<typeof monaColorPaletteBaseVariants>;

export type ColorPaletteItemVariantsFunction = (props?: ColorPaletteItemVariantProps) => string;
export type ColorPaletteItemVariantProps = VariantProps<typeof monaColorPaletteItemVariants>;

export type ColorPaletteBaseVariantInput = VariantInputs<ColorPaletteBaseVariantProps>;
export type ColorPaletteItemVariantInput = VariantInputs<ColorPaletteItemVariantProps>;

export type ColorPaletteVariantProps = ColorPaletteBaseVariantProps & ColorPaletteItemVariantProps;
export type ColorPaletteVariantInput = ColorPaletteBaseVariantInput & ColorPaletteItemVariantInput;

export interface ColorPaletteVariantsFunctions {
    readonly base: ColorPaletteBaseVariantsFunction;
    readonly item: ColorPaletteItemVariantsFunction;
}

export type ColorPaletteStyleStrategy = ThemeStrategy<ColorPaletteVariantsFunctions>;

export interface ColorPaletteBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface ColorPaletteItemCompoundStyleOverride {
    readonly when: Partial<ColorPaletteItemVariantProps>;
    readonly class: ClassValue;
}

export interface ColorPaletteItemStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ColorPaletteItemVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ColorPaletteItemCompoundStyleOverride[];
}

export interface ColorPaletteStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ColorPaletteBaseStyleOverrides;
    readonly item?: ColorPaletteItemStyleOverrides;
}

export type ColorPaletteStylesProviderConfig =
    | ColorPaletteStyleOverrides
    | { readonly strategy: ColorPaletteStyleStrategy };
