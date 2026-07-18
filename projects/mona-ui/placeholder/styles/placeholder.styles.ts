import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    placeholderBaseVariants as annaPlaceholderBaseVariants,
    placeholderTextVariants as annaPlaceholderTextVariants
} from "./placeholder.anna.styles";
import {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";

export const placeholderBaseThemeVariants = createThemeStrategy({
    anna: annaPlaceholderBaseVariants,
    mona: monaPlaceholderBaseVariants
});

export const placeholderTextThemeVariants = createThemeStrategy({
    anna: annaPlaceholderTextVariants,
    mona: monaPlaceholderTextVariants
});

type PlaceholderBaseVariantProps = VariantProps<ReturnType<typeof placeholderBaseThemeVariants>>;
type PlaceholderBaseVariantInput = VariantInputs<PlaceholderBaseVariantProps>;
type PlaceholderTextVariantProps = VariantProps<ReturnType<typeof placeholderTextThemeVariants>>;
type PlaceholderTextVariantInput = VariantInputs<PlaceholderTextVariantProps>;

export type PlaceholderVariantProps = PlaceholderBaseVariantProps & PlaceholderTextVariantProps;
export type PlaceholderVariantInput = PlaceholderBaseVariantInput & PlaceholderTextVariantInput;
