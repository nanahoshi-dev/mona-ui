import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";

const placeholderBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPlaceholderBaseVariants },
    monaPlaceholderBaseVariants
);

export const placeholderBaseThemeVariants = (theme: ThemeStyle) => placeholderBaseThemeVariantsStrategy.resolve(theme);

const placeholderTextThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPlaceholderTextVariants },
    monaPlaceholderTextVariants
);

export const placeholderTextThemeVariants = (theme: ThemeStyle) => placeholderTextThemeVariantsStrategy.resolve(theme);

type PlaceholderBaseVariantProps = VariantProps<ReturnType<typeof placeholderBaseThemeVariants>>;
type PlaceholderBaseVariantInput = VariantInputs<PlaceholderBaseVariantProps>;
type PlaceholderTextVariantProps = VariantProps<ReturnType<typeof placeholderTextThemeVariants>>;
type PlaceholderTextVariantInput = VariantInputs<PlaceholderTextVariantProps>;

export type PlaceholderVariantProps = PlaceholderBaseVariantProps & PlaceholderTextVariantProps;
export type PlaceholderVariantInput = PlaceholderBaseVariantInput & PlaceholderTextVariantInput;
