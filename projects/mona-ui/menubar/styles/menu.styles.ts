import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    contextMenuContentVariants as annaContextMenuContentVariants,
    contextMenuDividerVariants as annaContextMenuDividerVariants,
    menubarBaseVariants as annaMenubarVariants,
    menubarListItemVariants as annaMenubarListItemVariants,
    menubarListVariants as annaMenubarListVariants,
    menuItemGroupHeaderVariants as annaMenuItemGroupHeaderVariants,
    menuItemIconVariants as annaMenuItemIconVariants,
    menuItemLinkVariants as annaMenuItemLinkVariants,
    menuItemShortcutVariants as annaMenuItemShortcutVariants,
    menuItemTextVariants as annaMenuItemTextVariants,
    menuItemVariants as annaMenuItemVariants
} from "./menu.anna.styles";
import {
    contextMenuContentVariants as monaContextMenuContentVariants,
    contextMenuDividerVariants as monaContextMenuDividerVariants,
    menubarBaseVariants as monaMenubarVariants,
    menubarListItemVariants as monaMenubarListItemVariants,
    menubarListVariants as monaMenubarListVariants,
    menuItemGroupHeaderVariants as monaMenuItemGroupHeaderVariants,
    menuItemIconVariants as monaMenuItemIconVariants,
    menuItemLinkVariants as monaMenuItemLinkVariants,
    menuItemShortcutVariants as monaMenuItemShortcutVariants,
    menuItemTextVariants as monaMenuItemTextVariants,
    menuItemVariants as monaMenuItemVariants
} from "./menu.mona.styles";

export const contextMenuContentThemeVariants = createThemeStrategy({
    anna: annaContextMenuContentVariants,
    mona: monaContextMenuContentVariants
});

export const contextMenuDividerThemeVariants = createThemeStrategy({
    anna: annaContextMenuDividerVariants,
    mona: monaContextMenuDividerVariants
});

export const menuItemGroupHeaderThemeVariants = createThemeStrategy({
    anna: annaMenuItemGroupHeaderVariants,
    mona: monaMenuItemGroupHeaderVariants
});

export const menuItemIconThemeVariants = createThemeStrategy({
    anna: annaMenuItemIconVariants,
    mona: monaMenuItemIconVariants
});

export const menuItemLinkThemeVariants = createThemeStrategy({
    anna: annaMenuItemLinkVariants,
    mona: monaMenuItemLinkVariants
});

export const menuItemShortcutThemeVariants = createThemeStrategy({
    anna: annaMenuItemShortcutVariants,
    mona: monaMenuItemShortcutVariants
});

export const menuItemTextThemeVariants = createThemeStrategy({
    anna: annaMenuItemTextVariants,
    mona: monaMenuItemTextVariants
});

export const menuItemThemeVariants = createThemeStrategy({
    anna: annaMenuItemVariants,
    mona: monaMenuItemVariants
});

export const menubarBaseThemeVariants = createThemeStrategy({
    anna: annaMenubarVariants,
    mona: monaMenubarVariants
});

export const menubarListItemThemeVariants = createThemeStrategy({
    anna: annaMenubarListItemVariants,
    mona: monaMenubarListItemVariants
});

export const menubarListThemeVariants = createThemeStrategy({
    anna: annaMenubarListVariants,
    mona: monaMenubarListVariants
});

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
