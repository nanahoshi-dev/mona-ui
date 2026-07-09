import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabContentVariants as monaTabContentVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";

export const tabListBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabListBaseVariants;
        default:
            return monaTabListBaseVariants;
    }
};

export const tabListListWrapperThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabListListWrapperVariants;
        default:
            return monaTabListListWrapperVariants;
    }
};

export const tabListListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabListListVariants;
        default:
            return monaTabListListVariants;
    }
};

export const tabListListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabListListItemVariants;
        default:
            return monaTabListListItemVariants;
    }
};

export const tabListScrollButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabListScrollButtonVariants;
        default:
            return monaTabListScrollButtonVariants;
    }
};

export const tabContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabContentVariants;
        default:
            return monaTabContentVariants;
    }
};

export const tabsBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabsBaseVariants;
        default:
            return monaTabsBaseVariants;
    }
};

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
