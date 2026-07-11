import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";

export type ColorPickerBaseVariantsFunction = (props?: ColorPickerBaseVariantProps) => string;
export type ColorPickerBaseVariantProps = VariantProps<typeof monaColorPickerBaseVariants>;

export type ColorPickerColorVariantsFunction = (props?: ColorPickerColorVariantProps) => string;
export type ColorPickerColorVariantProps = VariantProps<typeof monaColorPickerColorVariants>;

export type ColorPickerBaseVariantInput = VariantInputs<ColorPickerBaseVariantProps>;
export type ColorPickerColorVariantInput = VariantInputs<ColorPickerColorVariantProps>;

export type ColorPickerVariantProps = ColorPickerBaseVariantProps & ColorPickerColorVariantProps;
export type ColorPickerVariantInput = Omit<ColorPickerBaseVariantInput, "expanded"> & ColorPickerColorVariantInput;

export interface ColorPickerVariantsFunctions {
    readonly base: ColorPickerBaseVariantsFunction;
    readonly color: ColorPickerColorVariantsFunction;
}

export type ColorPickerStyleStrategy = ThemeStrategy<ColorPickerVariantsFunctions>;

export interface ColorPickerBaseCompoundStyleOverride {
    readonly when: Partial<ColorPickerBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ColorPickerBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly expanded?: Partial<Record<`${NonNullable<ColorPickerBaseVariantProps["expanded"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ColorPickerBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ColorPickerBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly ColorPickerBaseCompoundStyleOverride[];
}

export interface ColorPickerColorStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ColorPickerColorVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ColorPickerColorVariantProps["size"]>, ClassValue>>;
}

export interface ColorPickerStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ColorPickerBaseStyleOverrides;
    readonly color?: ColorPickerColorStyleOverrides;
}

export type ColorPickerStylesProviderConfig =
    | ColorPickerStyleOverrides
    | { readonly strategy: ColorPickerStyleStrategy };
