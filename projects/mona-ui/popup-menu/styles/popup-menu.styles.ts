import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { themeOverlaySurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";

export const popupMenuBaseThemeVariants = cva(`h-full w-full overflow-hidden`, {
    variants: {
        rounded: {
            small: "rounded-sm",
            medium: "rounded-md",
            large: "rounded-lg",
            none: "rounded-none"
        }
    }
});

export const popupMenuContainerThemeVariants = cva(
    `
        flex flex-col p-1
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay) outline-none focus-visible:outline-hidden
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

export const popupMenuGroupHeaderThemeVariants = cva(
    `inline-flex w-full select-none px-2 py-1 font-bold text-muted-foreground`,
    {
        variants: {
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-base"
            }
        }
    }
);

export const popupMenuIconContainerThemeVariants = cva(`absolute start-2 flex items-center justify-center`);

/**
 * A menu item. The active one, which the arrows and the pointer move, has a background. In forced colors, where
 * backgrounds don't paint, it is drawn in Highlight, its text and icons in HighlightText. Disabled items are GrayText, and
 * a disabled active one has a Highlight outline instead, since GrayText on Highlight can be unreadable.
 */
export const popupMenuItemThemeVariants = cva(
    `
        relative flex cursor-pointer select-none items-center gap-2 py-1 pe-2 ps-8
        text-foreground outline-none focus-visible:outline-hidden
        hover:bg-[var(--mona-menu-item-hover-background,var(--color-hover))] hover:text-foreground
        focus-within:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]
        focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[active='true']:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]
        data-[active='true']:text-foreground
        data-[active='true']:data-[disabled='true']:text-disabled-foreground
        forced-colors:data-[disabled='true']:text-[GrayText]
        forced-colors:data-[active='true']:forced-color-adjust-none
        forced-colors:data-[active='true']:bg-[Highlight]
        forced-colors:data-[active='true']:text-[HighlightText]
        forced-colors:data-[active='true']:**:text-[HighlightText]
        forced-colors:data-[active='true']:data-[disabled='true']:bg-[Canvas]
        forced-colors:data-[active='true']:data-[disabled='true']:text-[GrayText]
        forced-colors:data-[active='true']:data-[disabled='true']:**:text-[GrayText]
        forced-colors:data-[active='true']:data-[disabled='true']:outline-solid
        forced-colors:data-[active='true']:data-[disabled='true']:outline-1
        forced-colors:data-[active='true']:data-[disabled='true']:-outline-offset-1
        forced-colors:data-[active='true']:data-[disabled='true']:outline-[Highlight]
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
                small: "text-xs",
                medium: "text-sm",
                large: "text-base"
            }
        }
    }
);

export const popupMenuLinkThemeVariants = cva(`flex items-center justify-center`);

type PopupMenuBaseVariantProps = VariantProps<typeof popupMenuBaseThemeVariants>;

type PopupMenuContainerVariantProps = VariantProps<typeof popupMenuContainerThemeVariants>;

type PopupMenuGroupHeaderVariantProps = VariantProps<typeof popupMenuGroupHeaderThemeVariants>;

type PopupMenuIconContainerVariantProps = VariantProps<typeof popupMenuIconContainerThemeVariants>;

type PopupMenuItemVariantProps = VariantProps<typeof popupMenuItemThemeVariants>;

type PopupMenuLinkVariantProps = VariantProps<typeof popupMenuLinkThemeVariants>;

export type PopupMenuVariantProps = PopupMenuBaseVariantProps &
    PopupMenuContainerVariantProps &
    PopupMenuGroupHeaderVariantProps &
    PopupMenuIconContainerVariantProps &
    PopupMenuItemVariantProps &
    PopupMenuLinkVariantProps;

export type PopupMenuVariantInput = VariantInputs<PopupMenuVariantProps>;
