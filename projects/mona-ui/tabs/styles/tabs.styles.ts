import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    tabContentVariants as monaTabContentVariants,
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";

const tabListBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTabListBaseVariants },
    monaTabListBaseVariants
);

export const tabListBaseThemeVariants = (theme: ThemeStyle) => tabListBaseThemeVariantsStrategy.resolve(theme);

const tabListListWrapperThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTabListListWrapperVariants },
    monaTabListListWrapperVariants
);

export const tabListListWrapperThemeVariants = (theme: ThemeStyle) =>
    tabListListWrapperThemeVariantsStrategy.resolve(theme);

const tabListListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTabListListVariants },
    monaTabListListVariants
);

export const tabListListThemeVariants = (theme: ThemeStyle) => tabListListThemeVariantsStrategy.resolve(theme);

const tabListListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTabListListItemVariants },
    monaTabListListItemVariants
);

export const tabListListItemThemeVariants = (theme: ThemeStyle) => tabListListItemThemeVariantsStrategy.resolve(theme);

const tabListScrollButtonThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTabListScrollButtonVariants },
    monaTabListScrollButtonVariants
);

export const tabListScrollButtonThemeVariants = (theme: ThemeStyle) =>
    tabListScrollButtonThemeVariantsStrategy.resolve(theme);

const tabContentThemeVariantsStrategy = createThemeStrategy({ mona: monaTabContentVariants }, monaTabContentVariants);

export const tabContentThemeVariants = (theme: ThemeStyle) => tabContentThemeVariantsStrategy.resolve(theme);

const tabsBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaTabsBaseVariants }, monaTabsBaseVariants);

export const tabsBaseThemeVariants = (theme: ThemeStyle) => tabsBaseThemeVariantsStrategy.resolve(theme);

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
