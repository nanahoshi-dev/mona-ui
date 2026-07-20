import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const contextMenuContentThemeVariants = cva(
    `
        w-full gap-4 overflow-hidden
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay)
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "px-1 py-0.5",
                medium: "px-1.5 py-1",
                large: "px-2 py-1.5"
            }
        }
    }
);

export const contextMenuDividerThemeVariants = cva(`-mx-0.5 my-1 h-px bg-border-subtle`);

export const menuItemGroupHeaderThemeVariants = cva(
    `inline-flex w-full select-none px-2 py-1 font-bold text-muted-foreground`,
    {
        variants: {
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-md"
            }
        }
    }
);

export const menuItemIconThemeVariants = cva(`absolute left-2 flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemLinkThemeVariants = cva(`flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemShortcutThemeVariants = cva(`flex flex-1 items-center justify-end text-xs text-muted-foreground`);

export const menuItemTextThemeVariants = cva(`flex flex-1 items-center justify-start gap-2`);

export const menuItemThemeVariants = cva(
    `
        relative flex cursor-default select-none items-center gap-4 px-2 py-1.5
        text-foreground outline-none
        hover:bg-[var(--mona-menu-item-hover-background,var(--color-hover))] hover:text-foreground
        focus-within:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]
        focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[focused]:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]
        data-[focused]:text-foreground
    `,
    {
        variants: {
            size: {
                small: "px-2 py-1 text-xs",
                medium: "px-2 py-1.5 text-sm",
                large: "px-3 py-2 text-md"
            }
        }
    }
);

export const menubarBaseThemeVariants = cva(
    `
        flex items-center justify-center gap-1 overflow-hidden
        bg-(--mona-menubar-background)
        [background-image:var(--mona-menubar-background-image,var(--mona-effect-raised-background-image,none))]
        [backdrop-filter:var(--mona-menubar-backdrop-filter,var(--mona-effect-raised-backdrop-filter,none))]
        [-webkit-backdrop-filter:var(--mona-menubar-backdrop-filter,var(--mona-effect-raised-backdrop-filter,none))]
        text-foreground
        border border-border-subtle shadow-(--mona-menubar-shadow)
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground data-[disabled='true']:opacity-50
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "h-8 text-xs",
                medium: "h-10 text-sm",
                large: "h-12 text-md"
            }
        }
    }
);

export const menubarListItemThemeVariants = cva(
    `
        flex h-full items-center justify-center px-2 py-1.5
        cursor-pointer text-foreground outline-none
        hover:bg-[var(--mona-menu-item-hover-background,var(--color-hover))] hover:text-foreground
        focus-within:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]
        focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[active='true']:bg-[var(--mona-menu-item-hover-background,var(--color-selected))]
        data-[active='true']:text-[var(--mona-menu-item-hover-foreground,var(--color-selected-foreground))]
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const menubarListThemeVariants = cva(
    `
        flex h-full w-full list-none items-center p-1
        select-none
    `
);

export type ContextMenuContentVariantProps = VariantProps<typeof contextMenuContentThemeVariants>;

export type ContextMenuContentVariantInput = VariantInputs<ContextMenuContentVariantProps>;

export type MenuItemVariantProps = VariantProps<typeof menuItemThemeVariants>;

export type MenuItemVariantInput = VariantInputs<MenuItemVariantProps>;

export type MenubarBaseVariantProps = VariantProps<typeof menubarBaseThemeVariants>;

export type MenubarBaseVariantInput = VariantInputs<MenubarBaseVariantProps>;

export type MenubarListItemVariants = VariantProps<typeof menubarListItemThemeVariants>;

export type MenubarListItemInput = VariantInputs<MenubarListItemVariants>;

export type MenubarListVariants = VariantProps<typeof menubarListThemeVariants>;

export type MenubarListInput = VariantInputs<MenubarListVariants>;

export type MenubarVariantProps = MenubarBaseVariantProps & MenubarListItemVariants & MenubarListVariants;

export type MenubarVariantInput = VariantInputs<MenubarVariantProps>;
