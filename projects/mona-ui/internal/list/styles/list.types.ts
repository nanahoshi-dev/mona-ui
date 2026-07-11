import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    listGroupHeaderTextVariants as monaListGroupHeaderTextVariants,
    listGroupHeaderVariants as monaListGroupHeaderVariants,
    listInnerListVariants as monaListInnerListVariants,
    listItemBaseVariants as monaListItemBaseVariants,
    listItemContentVariants as monaListItemContentVariants,
    listVariants as monaListVariants
} from "./list.mona.styles";

export type ListVariantsFunction = (props?: ListVariantProps) => string;
export type ListVariantProps = VariantProps<typeof monaListVariants>;

export type ListInnerListVariantsFunction = (props?: ListInnerListVariantProps) => string;
export type ListInnerListVariantProps = VariantProps<typeof monaListInnerListVariants>;

export type ListGroupHeaderVariantsFunction = (props?: ListGroupHeaderVariantProps) => string;
export type ListGroupHeaderVariantProps = VariantProps<typeof monaListGroupHeaderVariants>;

export type ListGroupHeaderTextVariantsFunction = (props?: ListGroupHeaderTextVariantProps) => string;
export type ListGroupHeaderTextVariantProps = VariantProps<typeof monaListGroupHeaderTextVariants>;

export type ListItemBaseVariantsFunction = (props?: ListItemBaseVariantProps) => string;
export type ListItemBaseVariantProps = VariantProps<typeof monaListItemBaseVariants>;

export type ListItemContentVariantsFunction = (props?: ListItemContentVariantProps) => string;
export type ListItemContentVariantProps = VariantProps<typeof monaListItemContentVariants>;

export interface ListStylesVariantsFunctions {
    readonly list: ListVariantsFunction;
    readonly innerList: ListInnerListVariantsFunction;
    readonly groupHeader: ListGroupHeaderVariantsFunction;
    readonly groupHeaderText: ListGroupHeaderTextVariantsFunction;
    readonly itemBase: ListItemBaseVariantsFunction;
    readonly itemContent: ListItemContentVariantsFunction;
}

export type ListStyleStrategy = ThemeStrategy<ListStylesVariantsFunctions>;

export interface ListStyleOverrides {
    readonly base?: ClassValue;
}

export interface ListInnerListStyleOverrides {
    readonly base?: ClassValue;
}

export interface ListGroupHeaderStyleOverrides {
    readonly base?: ClassValue;
    readonly hasTemplate?: Partial<Record<`${NonNullable<ListGroupHeaderVariantProps["hasTemplate"]>}`, ClassValue>>;
}

export interface ListGroupHeaderTextStyleOverrides {
    readonly base?: ClassValue;
    readonly hasTemplate?: Partial<
        Record<`${NonNullable<ListGroupHeaderTextVariantProps["hasTemplate"]>}`, ClassValue>
    >;
}

export interface ListItemBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface ListItemContentCompoundStyleOverride {
    readonly when: Partial<ListItemContentVariantProps>;
    readonly class: ClassValue;
}

export interface ListItemContentStyleOverrides {
    readonly base?: ClassValue;
    readonly checkboxes?: Partial<Record<`${NonNullable<ListItemContentVariantProps["checkboxes"]>}`, ClassValue>>;
    readonly highlighted?: Partial<Record<`${NonNullable<ListItemContentVariantProps["highlighted"]>}`, ClassValue>>;
    readonly selected?: Partial<Record<`${NonNullable<ListItemContentVariantProps["selected"]>}`, ClassValue>>;
    readonly disabled?: Partial<Record<`${NonNullable<ListItemContentVariantProps["disabled"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly ListItemContentCompoundStyleOverride[];
}

export interface ListStylesOverrides {
    readonly theme?: ThemeStyle;
    readonly list?: ListStyleOverrides;
    readonly innerList?: ListInnerListStyleOverrides;
    readonly groupHeader?: ListGroupHeaderStyleOverrides;
    readonly groupHeaderText?: ListGroupHeaderTextStyleOverrides;
    readonly itemBase?: ListItemBaseStyleOverrides;
    readonly itemContent?: ListItemContentStyleOverrides;
}

export type ListStylesProviderConfig = ListStylesOverrides | { readonly strategy: ListStyleStrategy };
