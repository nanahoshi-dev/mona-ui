import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
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

const contextMenuContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaContextMenuContentVariants },
    monaContextMenuContentVariants
);

export const contextMenuContentThemeVariants = (theme: ThemeStyle) =>
    contextMenuContentThemeVariantsStrategy.resolve(theme);

const contextMenuDividerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaContextMenuDividerVariants },
    monaContextMenuDividerVariants
);

export const contextMenuDividerThemeVariants = (theme: ThemeStyle) =>
    contextMenuDividerThemeVariantsStrategy.resolve(theme);

const menuItemGroupHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenuItemGroupHeaderVariants },
    monaMenuItemGroupHeaderVariants
);

export const menuItemGroupHeaderThemeVariants = (theme: ThemeStyle) =>
    menuItemGroupHeaderThemeVariantsStrategy.resolve(theme);

const menuItemIconThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenuItemIconVariants },
    monaMenuItemIconVariants
);

export const menuItemIconThemeVariants = (theme: ThemeStyle) => menuItemIconThemeVariantsStrategy.resolve(theme);

const menuItemLinkThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenuItemLinkVariants },
    monaMenuItemLinkVariants
);

export const menuItemLinkThemeVariants = (theme: ThemeStyle) => menuItemLinkThemeVariantsStrategy.resolve(theme);

const menuItemShortcutThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenuItemShortcutVariants },
    monaMenuItemShortcutVariants
);

export const menuItemShortcutThemeVariants = (theme: ThemeStyle) =>
    menuItemShortcutThemeVariantsStrategy.resolve(theme);

const menuItemTextThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenuItemTextVariants },
    monaMenuItemTextVariants
);

export const menuItemTextThemeVariants = (theme: ThemeStyle) => menuItemTextThemeVariantsStrategy.resolve(theme);

const menuItemThemeVariantsStrategy = createThemeStrategy({ mona: monaMenuItemVariants }, monaMenuItemVariants);

export const menuItemThemeVariants = (theme: ThemeStyle) => menuItemThemeVariantsStrategy.resolve(theme);

const menubarBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaMenubarVariants }, monaMenubarVariants);

export const menubarBaseThemeVariants = (theme: ThemeStyle) => menubarBaseThemeVariantsStrategy.resolve(theme);

const menubarListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenubarListItemVariants },
    monaMenubarListItemVariants
);

export const menubarListItemThemeVariants = (theme: ThemeStyle) => menubarListItemThemeVariantsStrategy.resolve(theme);

const menubarListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMenubarListVariants },
    monaMenubarListVariants
);

export const menubarListThemeVariants = (theme: ThemeStyle) => menubarListThemeVariantsStrategy.resolve(theme);

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
