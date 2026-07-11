import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";

export type PlaceholderBaseVariantsFunction = (props?: PlaceholderBaseVariantProps) => string;
export type PlaceholderBaseVariantProps = VariantProps<typeof monaPlaceholderBaseVariants>;

export type PlaceholderTextVariantsFunction = (props?: PlaceholderTextVariantProps) => string;
export type PlaceholderTextVariantProps = VariantProps<typeof monaPlaceholderTextVariants>;

export type PlaceholderBaseVariantInput = VariantInputs<PlaceholderBaseVariantProps>;
export type PlaceholderTextVariantInput = VariantInputs<PlaceholderTextVariantProps>;

export type PlaceholderVariantProps = PlaceholderBaseVariantProps & PlaceholderTextVariantProps;
export type PlaceholderVariantInput = PlaceholderBaseVariantInput & PlaceholderTextVariantInput;

export interface PlaceholderVariantsFunctions {
    readonly base: PlaceholderBaseVariantsFunction;
    readonly text: PlaceholderTextVariantsFunction;
}

export type PlaceholderStyleStrategy = ThemeStrategy<PlaceholderVariantsFunctions>;

export interface PlaceholderBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface PlaceholderTextStyleOverrides {
    readonly base?: ClassValue;
}

export interface PlaceholderStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: PlaceholderBaseStyleOverrides;
    readonly text?: PlaceholderTextStyleOverrides;
}

export type PlaceholderStylesProviderConfig = PlaceholderStyleOverrides | { readonly strategy: PlaceholderStyleStrategy };
