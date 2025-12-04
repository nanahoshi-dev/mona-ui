import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabContentVariants as monaTabContentVariants
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

export const tabContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTabContentVariants;
        default:
            return monaTabContentVariants;
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
type TabContentVariantProps = VariantProps<ReturnType<typeof tabContentThemeVariants>>;
type TabContentVariantInput = VariantInputs<TabContentVariantProps>;

export type TabListVariantProps = TabListBaseVariantProps &
    TabListListWrapperVariantProps &
    TabListListVariantProps &
    TabListListItemVariantProps;
export type TabListVariantInput = TabListBaseVariantInput &
    TabListListWrapperVariantInput &
    TabListListVariantInput &
    Omit<TabListListItemVariantInput, "active" | "disabled">;

export type TabsVariantProps = TabListVariantProps & TabContentVariantProps;
export type TabsVariantInput = TabListVariantInput & TabContentVariantInput;
