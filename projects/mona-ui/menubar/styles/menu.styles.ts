import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/internal";
import {
    contextMenuContentVariants as monaContextMenuContentVariants,
    contextMenuDividerVariants as monaContextMenuDividerVariants,
    menuItemGroupHeaderVariants as monaMenuItemGroupHeaderVariants,
    menuItemIconVariants as monaMenuItemIconVariants,
    menuItemLinkVariants as monaMenuItemLinkVariants,
    menuItemShortcutVariants as monaMenuItemShortcutVariants,
    menuItemTextVariants as monaMenuItemTextVariants,
    menuItemVariants as monaMenuItemVariants,
    menubarListItemVariants as monaMenubarListItemVariants,
    menubarListVariants as monaMenubarListVariants,
    menubarBaseVariants as monaMenubarVariants
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

export const menubarBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenubarVariants;
        default:
            return monaMenubarVariants;
    }
};

export const menubarListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenubarListItemVariants;
        default:
            return monaMenubarListItemVariants;
    }
};

export const menubarListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMenubarListVariants;
        default:
            return monaMenubarListVariants;
    }
};

export type ContextMenuContentVariantProps = VariantProps<ReturnType<typeof contextMenuContentThemeVariants>>;
export type ContextMenuContentVariantInput = VariantInputs<ContextMenuContentVariantProps>;

export type MenuItemVariantProps = VariantProps<ReturnType<typeof menuItemThemeVariants>>;
export type MenuItemVariantInput = VariantInputs<MenuItemVariantProps>;

export type MenubarBaseVariantProps = VariantProps<ReturnType<typeof menubarBaseThemeVariants>>;
export type MenubarBaseVariantInput = VariantInputs<MenubarBaseVariantProps>;

export type MenubarListItemVariants = VariantProps<ReturnType<typeof menubarListItemThemeVariants>>;
export type MenubarListItemInput = VariantInputs<MenubarListItemVariants>;

export type MenubarListVariants = VariantProps<ReturnType<typeof menubarListThemeVariants>>;
export type MenubarListInput = VariantInputs<MenubarListVariants>;

export type MenubarVariantProps = MenubarBaseVariantProps & MenubarListItemVariants & MenubarListVariants;
export type MenubarVariantInput = VariantInputs<MenubarVariantProps>;
