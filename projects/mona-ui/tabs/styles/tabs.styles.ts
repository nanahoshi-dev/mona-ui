import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    tabContentVariants as annaTabContentVariants,
    tabListBaseVariants as annaTabListBaseVariants,
    tabListListItemVariants as annaTabListListItemVariants,
    tabListListVariants as annaTabListListVariants,
    tabListListWrapperVariants as annaTabListListWrapperVariants,
    tabListScrollButtonVariants as annaTabListScrollButtonVariants,
    tabsBaseVariants as annaTabsBaseVariants
} from "./tabs.anna.styles";
import {
    tabContentVariants as monaTabContentVariants,
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";

export const tabListBaseThemeVariants = createThemeStrategy({
    anna: annaTabListBaseVariants,
    mona: monaTabListBaseVariants
});

export const tabListListWrapperThemeVariants = createThemeStrategy({
    anna: annaTabListListWrapperVariants,
    mona: monaTabListListWrapperVariants
});

export const tabListListThemeVariants = createThemeStrategy({
    anna: annaTabListListVariants,
    mona: monaTabListListVariants
});

export const tabListListItemThemeVariants = createThemeStrategy({
    anna: annaTabListListItemVariants,
    mona: monaTabListListItemVariants
});

export const tabListScrollButtonThemeVariants = createThemeStrategy({
    anna: annaTabListScrollButtonVariants,
    mona: monaTabListScrollButtonVariants
});

export const tabContentThemeVariants = createThemeStrategy({
    anna: annaTabContentVariants,
    mona: monaTabContentVariants
});

export const tabsBaseThemeVariants = createThemeStrategy({
    anna: annaTabsBaseVariants,
    mona: monaTabsBaseVariants
});

type TabListBaseVariantProps = VariantProps<ReturnType<typeof tabListBaseThemeVariants>>;
type TabListBaseVariantInput = VariantInputs<TabListBaseVariantProps>;
type TabListListWrapperVariantProps = VariantProps<ReturnType<typeof tabListListWrapperThemeVariants>>;
type TabListListWrapperVariantInput = VariantInputs<TabListListWrapperVariantProps>;
type TabListListVariantProps = VariantProps<ReturnType<typeof tabListListThemeVariants>>;
type TabListListVariantInput = VariantInputs<TabListListVariantProps>;
export type TabListListItemVariantProps = VariantProps<ReturnType<typeof tabListListItemThemeVariants>>;
export type TabListListItemVariantInput = VariantInputs<TabListListItemVariantProps>;
export type TabListScrollButtonVariantProps = VariantProps<ReturnType<typeof tabListScrollButtonThemeVariants>>;
export type TabListScrollButtonVariantInput = VariantInputs<TabListScrollButtonVariantProps>;

type TabContentVariantProps = VariantProps<ReturnType<typeof tabContentThemeVariants>>;
type TabContentVariantInput = VariantInputs<TabContentVariantProps>;
type TabsBaseVariantProps = VariantProps<ReturnType<typeof tabsBaseThemeVariants>>;
type TabsBaseVariantInput = VariantInputs<TabsBaseVariantProps>;

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
