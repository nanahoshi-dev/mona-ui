import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import { VariantProps } from "class-variance-authority";
import {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";

export const placeholderBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPlaceholderBaseVariants;
        default:
            return monaPlaceholderBaseVariants;
    }
};

export const placeholderTextThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPlaceholderTextVariants;
        default:
            return monaPlaceholderTextVariants;
    }
};

type PlaceholderBaseVariantProps = VariantProps<ReturnType<typeof placeholderBaseThemeVariants>>;
type PlaceholderBaseVariantInput = VariantInputs<PlaceholderBaseVariantProps>;
type PlaceholderTextVariantProps = VariantProps<ReturnType<typeof placeholderTextThemeVariants>>;
type PlaceholderTextVariantInput = VariantInputs<PlaceholderTextVariantProps>;

export type PlaceholderVariantProps = PlaceholderBaseVariantProps & PlaceholderTextVariantProps;
export type PlaceholderVariantInput = PlaceholderBaseVariantInput & PlaceholderTextVariantInput;
