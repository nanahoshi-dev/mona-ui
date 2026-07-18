import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    pagerBaseVariants as annaPagerBaseVariants,
    pagerInfoVariants as annaPagerInfoVariants,
    pagerInputVariants as annaPagerInputVariants,
    pagerListItemVariants as annaPagerListItemVariants,
    pagerListVariants as annaPagerListVariants
} from "./pager.anna.styles";
import {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListItemVariants as monaPagerListItemVariants,
    pagerListVariants as monaPagerListVariants
} from "./pager.mona.styles";

export const pagerBaseThemeVariants = createThemeStrategy({
    anna: annaPagerBaseVariants,
    mona: monaPagerBaseVariants
});

export const pagerInfoThemeVariants = createThemeStrategy({
    anna: annaPagerInfoVariants,
    mona: monaPagerInfoVariants
});

export const pagerInputThemeVariants = createThemeStrategy({
    anna: annaPagerInputVariants,
    mona: monaPagerInputVariants
});

export const pagerListThemeVariants = createThemeStrategy({
    anna: annaPagerListVariants,
    mona: monaPagerListVariants
});

export const pagerListItemThemeVariants = createThemeStrategy({
    anna: annaPagerListItemVariants,
    mona: monaPagerListItemVariants
});

type PagerBaseVariantProps = VariantProps<ReturnType<typeof pagerBaseThemeVariants>>;
type PagerBaseVariantInputs = VariantInputs<PagerBaseVariantProps>;

type PagerInputVariantProps = VariantProps<ReturnType<typeof pagerInputThemeVariants>>;
type PagerInputVariantInputs = VariantInputs<PagerInputVariantProps>;

type PagerListVariantProps = VariantProps<ReturnType<typeof pagerListThemeVariants>>;
type PagerListVariantInputs = VariantInputs<PagerListVariantProps>;

export type PagerVariantProps = PagerBaseVariantProps & PagerInputVariantProps & PagerListVariantProps;
export type PagerVariantInputs = PagerBaseVariantInputs & PagerInputVariantInputs & PagerListVariantInputs;
