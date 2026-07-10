import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListItemVariants as monaPagerListItemVariants,
    pagerListVariants as monaPagerListVariants
} from "./pager.mona.styles";

const pagerBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaPagerBaseVariants }, monaPagerBaseVariants);

export const pagerBaseThemeVariants = (theme: ThemeStyle) => pagerBaseThemeVariantsStrategy.resolve(theme);

const pagerInfoThemeVariantsStrategy = createThemeStrategy({ mona: monaPagerInfoVariants }, monaPagerInfoVariants);

export const pagerInfoThemeVariants = (theme: ThemeStyle) => pagerInfoThemeVariantsStrategy.resolve(theme);

const pagerInputThemeVariantsStrategy = createThemeStrategy({ mona: monaPagerInputVariants }, monaPagerInputVariants);

export const pagerInputThemeVariants = (theme: ThemeStyle) => pagerInputThemeVariantsStrategy.resolve(theme);

const pagerListThemeVariantsStrategy = createThemeStrategy({ mona: monaPagerListVariants }, monaPagerListVariants);

export const pagerListThemeVariants = (theme: ThemeStyle) => pagerListThemeVariantsStrategy.resolve(theme);

const pagerListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPagerListItemVariants },
    monaPagerListItemVariants
);

export const pagerListItemThemeVariants = (theme: ThemeStyle) => pagerListItemThemeVariantsStrategy.resolve(theme);

type PagerBaseVariantProps = VariantProps<ReturnType<typeof pagerBaseThemeVariants>>;
type PagerBaseVariantInputs = VariantInputs<PagerBaseVariantProps>;

type PagerInputVariantProps = VariantProps<ReturnType<typeof pagerInputThemeVariants>>;
type PagerInputVariantInputs = VariantInputs<PagerInputVariantProps>;

type PagerListVariantProps = VariantProps<ReturnType<typeof pagerListThemeVariants>>;
type PagerListVariantInputs = VariantInputs<PagerListVariantProps>;

export type PagerVariantProps = PagerBaseVariantProps & PagerInputVariantProps & PagerListVariantProps;
export type PagerVariantInputs = PagerBaseVariantInputs & PagerInputVariantInputs & PagerListVariantInputs;
