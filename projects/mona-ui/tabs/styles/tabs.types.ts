import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    tabContentVariants as monaTabContentVariants,
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";

export type TabListBaseVariantsFunction = (props?: TabListBaseVariantProps) => string;
export type TabListBaseVariantProps = VariantProps<typeof monaTabListBaseVariants>;

export type TabListListWrapperVariantsFunction = (props?: TabListListWrapperVariantProps) => string;
export type TabListListWrapperVariantProps = VariantProps<typeof monaTabListListWrapperVariants>;

export type TabListListVariantsFunction = (props?: TabListListVariantProps) => string;
export type TabListListVariantProps = VariantProps<typeof monaTabListListVariants>;

export type TabListListItemVariantsFunction = (props?: TabListListItemVariantProps) => string;
export type TabListListItemVariantProps = VariantProps<typeof monaTabListListItemVariants>;

export type TabListScrollButtonVariantsFunction = (props?: TabListScrollButtonVariantProps) => string;
export type TabListScrollButtonVariantProps = VariantProps<typeof monaTabListScrollButtonVariants>;

export type TabContentVariantsFunction = (props?: TabContentVariantProps) => string;
export type TabContentVariantProps = VariantProps<typeof monaTabContentVariants>;

export type TabsBaseVariantsFunction = (props?: TabsBaseVariantProps) => string;
export type TabsBaseVariantProps = VariantProps<typeof monaTabsBaseVariants>;

export type TabListBaseVariantInput = VariantInputs<TabListBaseVariantProps>;
export type TabListListWrapperVariantInput = VariantInputs<TabListListWrapperVariantProps>;
export type TabListListVariantInput = VariantInputs<TabListListVariantProps>;
export type TabListListItemVariantInput = VariantInputs<TabListListItemVariantProps>;
export type TabListScrollButtonVariantInput = VariantInputs<TabListScrollButtonVariantProps>;
export type TabContentVariantInput = VariantInputs<TabContentVariantProps>;
export type TabsBaseVariantInput = VariantInputs<TabsBaseVariantProps>;

export type TabListVariantProps = TabListBaseVariantProps &
    TabListListWrapperVariantProps &
    TabListListVariantProps &
    TabListListItemVariantProps &
    TabListScrollButtonVariantProps;
export type TabListVariantInput = TabListBaseVariantInput &
    TabListListWrapperVariantInput &
    TabListListVariantInput &
    Omit<TabListListItemVariantInput, "active" | "disabled"> &
    TabListScrollButtonVariantInput;

export type TabsVariantProps = TabsBaseVariantProps & TabListVariantProps & TabContentVariantProps;
export type TabsVariantInput = TabsBaseVariantInput & TabListVariantInput & TabContentVariantInput;

export interface TabsVariantsFunctions {
    readonly base: TabsBaseVariantsFunction;
    readonly content: TabContentVariantsFunction;
    readonly listBase: TabListBaseVariantsFunction;
    readonly listWrapper: TabListListWrapperVariantsFunction;
    readonly list: TabListListVariantsFunction;
    readonly listItem: TabListListItemVariantsFunction;
    readonly scrollButton: TabListScrollButtonVariantsFunction;
}

export type TabsStyleStrategy = ThemeStrategy<TabsVariantsFunctions>;

export interface TabsBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface TabContentStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TabContentVariantProps["rounded"]>, ClassValue>>;
}

export interface TabListBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TabListBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TabListBaseVariantProps["size"]>, ClassValue>>;
}

export interface TabListListWrapperStyleOverrides {
    readonly base?: ClassValue;
}

export interface TabListListStyleOverrides {
    readonly base?: ClassValue;
}

export interface TabListListItemCompoundStyleOverride {
    readonly when: Partial<TabListListItemVariantProps>;
    readonly class: ClassValue;
}

export interface TabListListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly active?: Partial<Record<`${NonNullable<TabListListItemVariantProps["active"]>}`, ClassValue>>;
    readonly disabled?: Partial<Record<`${NonNullable<TabListListItemVariantProps["disabled"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<TabListListItemVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly TabListListItemCompoundStyleOverride[];
}

export interface TabListScrollButtonStyleOverrides {
    readonly base?: ClassValue;
}

export interface TabsStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TabsBaseStyleOverrides;
    readonly content?: TabContentStyleOverrides;
    readonly listBase?: TabListBaseStyleOverrides;
    readonly listWrapper?: TabListListWrapperStyleOverrides;
    readonly list?: TabListListStyleOverrides;
    readonly listItem?: TabListListItemStyleOverrides;
    readonly scrollButton?: TabListScrollButtonStyleOverrides;
}

export type TabsStylesProviderConfig = TabsStyleOverrides | { readonly strategy: TabsStyleStrategy };
