import { VariantInputs } from "@mirei/mona-ui/internal";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListItemVariants as monaPagerListItemVariants,
    pagerListVariants as monaPagerListVariants
} from "./pager.mona.styles";

export const pagerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPagerBaseVariants;
        default:
            return monaPagerBaseVariants;
    }
};

export const pagerInfoThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPagerInfoVariants;
        default:
            return monaPagerInfoVariants;
    }
};

export const pagerInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPagerInputVariants;
        default:
            return monaPagerInputVariants;
    }
};

export const pagerListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPagerListVariants;
        default:
            return monaPagerListVariants;
    }
};

export const pagerListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPagerListItemVariants;
        default:
            return monaPagerListItemVariants;
    }
};

type PagerBaseVariantProps = VariantProps<ReturnType<typeof pagerBaseThemeVariants>>;
type PagerBaseVariantInputs = VariantInputs<PagerBaseVariantProps>;

type PagerInputVariantProps = VariantProps<ReturnType<typeof pagerInputThemeVariants>>;
type PagerInputVariantInputs = VariantInputs<PagerInputVariantProps>;

type PagerListVariantProps = VariantProps<ReturnType<typeof pagerListThemeVariants>>;
type PagerListVariantInputs = VariantInputs<PagerListVariantProps>;

export type PagerVariantProps = PagerBaseVariantProps & PagerInputVariantProps & PagerListVariantProps;
export type PagerVariantInputs = PagerBaseVariantInputs & PagerInputVariantInputs & PagerListVariantInputs;
