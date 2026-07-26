import { cva } from "class-variance-authority";
import { themeRaisedBackdropClasses } from "@nanahoshi/mona-ui/internal";
import type { SidebarVariant } from "../models/SidebarVariant";

/**
 * How much of the sidebar's inline axis each variant's own border takes up.
 *
 * Borders are painted inside the box under the global `border-box`, so they come out of the width the
 * parts inside are measured against: an icon rail of `3rem` less a region's `p-2` is meant to leave
 * exactly the `2rem` square a menu button becomes, and a border silently makes it 1px or 2px short —
 * enough to clip the edge off a footer avatar sized to that square. `SidebarComponent` adds this back
 * on, so the authored width is the width the contents actually get.
 *
 * It lives here, beside the variants that draw those borders, so the two cannot drift apart. It is a
 * plain length rather than a custom property because it lands in a transitioned `width`, and a
 * `var()` there resolves to a pending-substitution value that engines are not obliged to interpolate.
 */
export const sidebarBorderAllowance: Readonly<Record<SidebarVariant, string>> = Object.freeze({
    // A single edge border, whichever side it sits on.
    sidebar: "1px",
    // Bordered on all four sides, so the inline axis loses two of them.
    floating: "2px",
    // Draws no border of its own; the raised surface moves to the region beside it.
    inset: "0px"
});

/*
 * Every part that changes shape when the sidebar collapses runs on `--mona-motion-standard` with the
 * same easing, so the whole region moves as one piece instead of each part arriving on its own
 * schedule. The utilities are written out in full at each use site rather than shared through a
 * constant, because Tailwind extracts class names from source text and cannot follow an identifier.
 */

export const sidebarLayoutBaseThemeVariants = cva(
    `
        flex flex-row w-full h-screen h-dvh
        overflow-hidden
    `
);

export const sidebarInsetThemeVariants = cva(
    `
        flex flex-col grow flex-1 min-w-0
        overflow-auto
    `,
    {
        variants: {
            variant: {
                sidebar: "h-full",
                floating: "h-full",
                // The `inset` variant moves the raised surface from the sidebar onto this region.
                inset: `
                    m-2 h-[calc(100%-1rem)] rounded-lg
                    border border-(--color-border) bg-(--color-surface) shadow-(--shadow-raised)
                `
            }
        }
    }
);

export const sidebarGroupHeaderThemeVariants = cva(
    `
        flex items-center px-2 overflow-hidden
        transition-[height] duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `,
    {
        variants: {
            // On the rail the label and any action have stood down, so the row closes rather than
            // reserving empty space. Closing it by height keeps it in step with the sidebar's width;
            // the inset stays put so nothing inside it slides while it does.
            iconOnly: {
                true: "h-0",
                false: "h-8"
            }
        }
    }
);

export const sidebarGroupLabelThemeVariants = cva(
    `
        flex grow-1 items-center shrink-0
        text-xs font-medium whitespace-nowrap text-(--color-sidebar-foreground)/70
        transition-[opacity,visibility] duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `
);

export const sidebarMenuItemThemeVariants = cva(
    `
        flex text-base gap-1
        group/menu-item
        data-[active=true]:bg-(--color-sidebar-primary)
        data-[active=true]:text-(--color-sidebar-primary-foreground)
        data-[active=true]:hover:bg-(--color-sidebar-primary)!
        data-[active=true]:hover:text-(--color-sidebar-primary-foreground)!
    `,
    {
        variants: {
            collapsible: {
                true: "flex-col items-stretch",
                false: "flex-row items-center rounded-md hover:bg-(--color-sidebar-accent)"
            },
            // The item takes its width from the menu, which takes it from the sidebar, so it narrows
            // with the animation instead of snapping to a rail-sized box of its own.
            iconOnly: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [
            // On the rail a collapsible item has nothing left to stack, so it behaves like any other row.
            {
                collapsible: true,
                iconOnly: true,
                class: "flex-row items-center rounded-md hover:bg-(--color-sidebar-accent)"
            }
        ]
    }
);

export const sidebarMenuSubThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
        ms-3.5 ps-2.5
        border-l border-(--color-sidebar-border)
    `
);

/**
 * The menu carries no inset of its own. Its enclosing region — a group, header or footer — owns the
 * one inset, and holds it steady in both states, which is what makes the icon rail's arithmetic work
 * out: a `3rem` rail less that region's `p-2` on each side leaves exactly one `2rem` icon square.
 *
 * It also means a menu placed in a region that is already inset needs no override. An override was
 * the only reason a consumer ever reached for `!important` here, because `px-*` and the logical
 * `ps-*`/`pe-*` an inset would have used are separate groups to `tailwind-merge`: it keeps both, and
 * which one lands is left to stylesheet order.
 */
export const sidebarMenuThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
    `
);

export const sidebarThemeVariants = cva(
    `
        relative flex flex-col shrink-0
        bg-(--color-sidebar) text-(--color-sidebar-foreground) overflow-hidden
        transition-[width] duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `,
    {
        variants: {
            // `side` only decides placement; the border it implies is applied per variant below,
            // so the `floating` and `inset` treatments are not left fighting a single edge border.
            side: {
                left: "order-first",
                right: "order-last"
            },
            variant: {
                sidebar: `h-full ${themeRaisedBackdropClasses}`,
                // Any change to the borders below must be matched in `sidebarBorderAllowance` above.
                floating: `
                    m-2 h-[calc(100%-1rem)] rounded-lg
                    border border-(--color-sidebar-border) shadow-(--shadow-raised)
                    ${themeRaisedBackdropClasses}
                `,
                inset: "m-2 h-[calc(100%-1rem)] bg-transparent"
            },
            // Once an offcanvas sidebar is fully collapsed any margin would leave a visible gutter.
            flush: {
                true: "m-0",
                false: ""
            }
        },
        compoundVariants: [
            { variant: "sidebar", side: "left", class: "border-r border-(--color-sidebar-border)" },
            { variant: "sidebar", side: "right", class: "border-l border-(--color-sidebar-border)" },
            { variant: "floating", flush: true, class: "h-full" },
            { variant: "inset", flush: true, class: "h-full" }
        ]
    }
);

export const sidebarMenuBadgeThemeVariants = cva(
    `
        ms-auto flex items-center justify-center shrink-0
        min-w-5 h-5 px-1.5
        rounded-md text-xs font-medium tabular-nums
        bg-(--color-sidebar-accent) text-(--color-sidebar-accent-foreground)
        pointer-events-none select-none
    `
);

export const sidebarRailThemeVariants = cva(
    `
        absolute inset-y-0 z-20 hidden w-1
        cursor-pointer
        transition-colors hover:bg-(--color-sidebar-border)
        focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-(--color-sidebar-ring)
        sm:flex
    `,
    {
        variants: {
            side: {
                left: "right-0",
                right: "left-0"
            }
        }
    }
);

export const sidebarSeparatorThemeVariants = cva(
    `
        shrink-0 h-px bg-(--color-sidebar-border)
        transition-[margin] duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `,
    {
        variants: {
            iconOnly: {
                true: "mx-1",
                false: "mx-2"
            }
        }
    }
);
