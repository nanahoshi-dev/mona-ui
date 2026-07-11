import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    pagerBaseVariants as monaPagerBaseVariants,
    pagerInfoVariants as monaPagerInfoVariants,
    pagerInputVariants as monaPagerInputVariants,
    pagerListItemVariants as monaPagerListItemVariants,
    pagerListVariants as monaPagerListVariants
} from "./pager.mona.styles";

export type PagerBaseVariantsFunction = (props?: PagerBaseVariantProps) => string;
export type PagerBaseVariantProps = VariantProps<typeof monaPagerBaseVariants>;

export type PagerInfoVariantsFunction = (props?: PagerInfoVariantProps) => string;
export type PagerInfoVariantProps = VariantProps<typeof monaPagerInfoVariants>;

export type PagerInputVariantsFunction = (props?: PagerInputVariantProps) => string;
export type PagerInputVariantProps = VariantProps<typeof monaPagerInputVariants>;

export type PagerListVariantsFunction = (props?: PagerListVariantProps) => string;
export type PagerListVariantProps = VariantProps<typeof monaPagerListVariants>;

export type PagerListItemVariantsFunction = (props?: PagerListItemVariantProps) => string;
export type PagerListItemVariantProps = VariantProps<typeof monaPagerListItemVariants>;

export type PagerBaseVariantInput = VariantInputs<PagerBaseVariantProps>;
export type PagerInputVariantInput = VariantInputs<PagerInputVariantProps>;
export type PagerListVariantInput = VariantInputs<PagerListVariantProps>;

export type PagerVariantProps = PagerBaseVariantProps & PagerInputVariantProps & PagerListVariantProps;
export type PagerVariantInputs = PagerBaseVariantInput & PagerInputVariantInput & PagerListVariantInput;

export interface PagerVariantsFunctions {
    readonly base: PagerBaseVariantsFunction;
    readonly info: PagerInfoVariantsFunction;
    readonly input: PagerInputVariantsFunction;
    readonly list: PagerListVariantsFunction;
    readonly listItem: PagerListItemVariantsFunction;
}

export type PagerStyleStrategy = ThemeStrategy<PagerVariantsFunctions>;

export interface PagerBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<PagerBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<PagerBaseVariantProps["size"]>, ClassValue>>;
}

export interface PagerInfoStyleOverrides {
    readonly base?: ClassValue;
}

export interface PagerInputStyleOverrides {
    readonly base?: ClassValue;
}

export interface PagerListStyleOverrides {
    readonly base?: ClassValue;
}

export interface PagerListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly active?: Partial<Record<`${NonNullable<PagerListItemVariantProps["active"]>}`, ClassValue>>;
}

export interface PagerStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: PagerBaseStyleOverrides;
    readonly info?: PagerInfoStyleOverrides;
    readonly input?: PagerInputStyleOverrides;
    readonly list?: PagerListStyleOverrides;
    readonly listItem?: PagerListItemStyleOverrides;
}

export type PagerStylesProviderConfig = PagerStyleOverrides | { readonly strategy: PagerStyleStrategy };
