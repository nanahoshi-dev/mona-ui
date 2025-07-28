import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";
import {
    contextMenuContentVariants as monaContextMenuContentVariants,
    contextMenuDividerVariants as monaContextMenuDividerVariants,
    menuItemGroupHeaderVariants as monaMenuItemGroupHeaderVariants,
    menuItemIconVariants as monaMenuItemIconVariants,
    menuItemLinkVariants as monaMenuItemLinkVariants,
    menuItemShortcutVariants as monaMenuItemShortcutVariants,
    menuItemTextVariants as monaMenuItemTextVariants,
    menuItemVariants as monaMenuItemVariants
} from "./menu.mona.styles";

export const contextMenuContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaContextMenuContentVariants;
        default:
            return monaContextMenuContentVariants;
    }
};

export const contextMenuDividerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaContextMenuDividerVariants;
        default:
            return monaContextMenuDividerVariants;
    }
};

export const menuItemGroupHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemGroupHeaderVariants;
        default:
            return monaMenuItemGroupHeaderVariants;
    }
};

export const menuItemIconThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemIconVariants;
        default:
            return monaMenuItemIconVariants;
    }
};

export const menuItemLinkThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemLinkVariants;
        default:
            return monaMenuItemLinkVariants;
    }
};

export const menuItemShortcutThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemShortcutVariants;
        default:
            return monaMenuItemShortcutVariants;
    }
};

export const menuItemTextThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemTextVariants;
        default:
            return monaMenuItemTextVariants;
    }
};

export const menuItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenuItemVariants;
        default:
            return monaMenuItemVariants;
    }
};

export type ContextMenuContentVariantProps = VariantProps<ReturnType<typeof contextMenuContentThemeVariants>>;
export type ContextMenuContentVariantInput = VariantInputs<ContextMenuContentVariantProps>;

export type MenuItemVariantProps = VariantProps<ReturnType<typeof menuItemThemeVariants>>;
export type MenuItemVariantInput = VariantInputs<MenuItemVariantProps>;
