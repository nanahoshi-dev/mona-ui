import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants,
    breadcrumbListVariants as monaBreadcrumbListVariants
} from "./breadcrumb.mona.styles";

export type BreadcrumbListVariantsFunction = (props?: BreadcrumbListVariantProps) => string;
export type BreadcrumbListVariantProps = VariantProps<typeof monaBreadcrumbListVariants>;

export type BreadcrumbListItemVariantsFunction = (props?: BreadcrumbListItemVariantProps) => string;
export type BreadcrumbListItemVariantProps = VariantProps<typeof monaBreadcrumbListItemVariants>;

export type BreadcrumbCurrentItemVariantsFunction = (props?: BreadcrumbCurrentItemVariantProps) => string;
export type BreadcrumbCurrentItemVariantProps = VariantProps<typeof monaBreadcrumbCurrentItemVariants>;

export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;
export type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps &
    BreadcrumbListItemVariantProps &
    BreadcrumbCurrentItemVariantProps;
export type BreadcrumbVariantInput = BreadcrumbListVariantInput & Omit<BreadcrumbListItemVariantInput, "listDisabled">;

export interface BreadcrumbVariantsFunctions {
    readonly list: BreadcrumbListVariantsFunction;
    readonly listItem: BreadcrumbListItemVariantsFunction;
    readonly currentItem: BreadcrumbCurrentItemVariantsFunction;
}

export type BreadcrumbStyleStrategy = ThemeStrategy<BreadcrumbVariantsFunctions>;

export interface BreadcrumbListStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<BreadcrumbListVariantProps["disabled"]>}`, ClassValue>>;
}

export interface BreadcrumbListItemCompoundStyleOverride {
    readonly when: Partial<BreadcrumbListItemVariantProps>;
    readonly class: ClassValue;
}

export interface BreadcrumbListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<BreadcrumbListItemVariantProps["disabled"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly BreadcrumbListItemCompoundStyleOverride[];
}

export interface BreadcrumbCurrentItemStyleOverrides {
    readonly base?: ClassValue;
}

export interface BreadcrumbStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly list?: BreadcrumbListStyleOverrides;
    readonly listItem?: BreadcrumbListItemStyleOverrides;
    readonly currentItem?: BreadcrumbCurrentItemStyleOverrides;
}

export type BreadcrumbStylesProviderConfig = BreadcrumbStyleOverrides | { readonly strategy: BreadcrumbStyleStrategy };
