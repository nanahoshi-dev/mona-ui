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

/**
 * `relative` is what scopes the drawer and its backdrop to this layout. They are positioned against
 * it rather than the viewport, so a sidebar embedded in a bounded region — a documentation example, a
 * split pane — overlays only that region, and a layout that fills the page behaves identically.
 */
export const sidebarLayoutBaseThemeVariants = cva(
    `
        relative flex flex-row w-full h-screen h-dvh
        overflow-hidden
    `
);

export const sidebarContentThemeVariants = cva("flex-1", {
    variants: {
        iconOnly: {
            true: "overflow-hidden",
            false: "overflow-x-hidden overflow-y-auto"
        }
    }
});

export const sidebarFooterThemeVariants = cva("p-2 shrink-0");

export const sidebarGroupThemeVariants = cva(
    `
        relative flex flex-col w-full p-2
    `
);

export const sidebarGroupContentThemeVariants = cva("w-full");

/**
 * This stays a static host class because consumers commonly compose `monaButton` on the same
 * element. The button owns `[class]`, so the sidebar publishes its state through `data-hidden`
 * instead of adding a competing class binding.
 */
export const sidebarGroupActionClasses = `
    p-1 w-auto h-auto
    visible opacity-100
    transition-[opacity,visibility] duration-(--mona-motion-standard) ease-out
    motion-reduce:transition-none
    data-[hidden=true]:invisible data-[hidden=true]:opacity-0
`;

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
            },
            behindDrawer: {
                true: "overflow-hidden!",
                false: ""
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
    `,
    {
        variants: {
            hidden: {
                true: "invisible opacity-0",
                false: "visible opacity-100"
            }
        }
    }
);

export const sidebarHeaderThemeVariants = cva("p-2 shrink-0");

/**
 * `monaTextBox` owns `[class]`, so the rail state is exposed through `data-hidden` and consumed by
 * this static class rather than by a second class binding.
 */
export const sidebarInputClasses = cva(`
    w-full h-8
    data-[hidden=true]:hidden
`);

export const sidebarMenuActionClasses = cva(`
    w-auto h-auto p-1!
    hover:bg-(--color-sidebar-accent)! hover:text-(--color-sidebar-accent-foreground)!
    group-data-[active=true]/menu-item:text-(--color-sidebar-primary-foreground)!
    data-[hidden=true]:hidden
`);

export const sidebarMenuSkeletonThemeVariants = cva(
    `
        flex h-8 w-full items-center overflow-hidden
        transition-[gap,padding] duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `,
    {
        variants: {
            iconOnly: {
                true: "gap-8 px-2",
                false: "gap-2 px-1"
            }
        }
    }
);

export const sidebarMenuItemThemeVariants = cva(
    `
        flex text-base gap-1
        group/menu-item
        data-[active=true]:bg-(--color-sidebar-primary)
        data-[active=true]:text-(--color-sidebar-primary-foreground)
        data-[active=true]:hover:bg-(--color-sidebar-primary)
        data-[active=true]:hover:text-(--color-sidebar-primary-foreground)
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

/**
 * The menu row's own appearance.
 *
 * It used to compose `ButtonDirective`, which owns a `[class]` binding of its own; every sidebar rule
 * that had to beat it needed `!important`, and the composition ruled anchors out entirely. Owning the
 * class here costs a handful of declarations and removes both problems.
 *
 * `shrink-0` on the leading visual is what stops a long label crushing it. It applies to the first
 * child whatever it is — an icon, an avatar — and to any icon elsewhere in the row.
 */
export const sidebarMenuButtonThemeVariants = cva(
    `
        flex w-full items-center justify-start overflow-hidden
        rounded-md border-0 bg-transparent
        text-start text-sm font-normal whitespace-nowrap no-underline
        outline-none
        focus-visible:ring-2 focus-visible:ring-(--color-sidebar-ring)/60
        [&>*:first-child]:shrink-0 [&>svg]:shrink-0
        [transition:gap_var(--mona-motion-standard)_ease-out,height_var(--mona-motion-standard)_ease-out,padding_var(--mona-motion-standard)_ease-out,background-color_100ms_ease-in-out,color_100ms_ease-in-out]
        motion-reduce:[transition:none]
    `,
    {
        variants: {
            active: {
                true: "text-(--color-sidebar-primary-foreground)",
                false: `
                    text-(--color-sidebar-foreground)
                    hover:bg-(--color-sidebar-accent) hover:text-(--color-sidebar-accent-foreground)
                `
            },
            disabled: {
                true: "opacity-50 pointer-events-none cursor-default",
                false: "cursor-pointer"
            },
            iconOnly: {
                true: "shrink-0 gap-8 h-8",
                false: "gap-2 p-1"
            },
            size: {
                medium: "",
                large: ""
            }
        },
        compoundVariants: [
            { iconOnly: false, size: "medium", class: "h-8" },
            { iconOnly: false, size: "large", class: "h-12" },
            { iconOnly: true, size: "medium", class: "p-2" },
            { iconOnly: true, size: "large", class: "p-0" }
        ]
    }
);

export const sidebarMenuSubThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
        ms-3.5 ps-2.5
        border-s border-(--color-sidebar-border)
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
            // Flex order is already direction-relative, which is why the borders below have to be
            // logical too — a physical `border-r` would land on the wrong edge under RTL.
            side: {
                start: "order-first",
                end: "order-last"
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
            // Once an offcanvas sidebar is fully collapsed any margin would leave a visible gutter, and
            // the border would leave a 1px sliver of surface down the edge of a panel that is supposed
            // to be gone entirely.
            flush: {
                true: "m-0 border-0",
                false: ""
            },
            /**
             * The compact presentation. The panel leaves the flex flow and becomes an overlay pinned to
             * one edge, sliding in on `translate` rather than `width` — a drawer that animated its width
             * would reflow its own contents for the whole transition.
             */
            drawer: {
                true: `
                    absolute inset-y-0 z-50 h-full m-0
                    shadow-(--shadow-overlay)
                    transition-[translate] duration-(--mona-motion-standard) ease-out
                    motion-reduce:transition-none
                `,
                false: ""
            },
            open: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [
            { drawer: false, variant: "sidebar", side: "start", class: "border-e border-(--color-sidebar-border)" },
            { drawer: false, variant: "sidebar", side: "end", class: "border-s border-(--color-sidebar-border)" },
            { drawer: false, variant: "floating", flush: true, class: "h-full" },
            { drawer: false, variant: "inset", flush: true, class: "h-full" },
            // A drawer is a surface in its own right whatever the docked variant looks like, so the
            // variant's margins, rounding and transparency are all dropped for it.
            { drawer: true, side: "start", class: "start-0" },
            { drawer: true, side: "end", class: "end-0" },
            { drawer: true, open: false, side: "start", class: "-translate-x-full" },
            { drawer: true, open: false, side: "end", class: "translate-x-full" },
            { drawer: true, variant: "floating", class: "rounded-none" },
            { drawer: true, variant: "inset", class: "bg-(--color-sidebar)" }
        ]
    }
);

/**
 * The scrim behind an open drawer. Fades rather than sliding, so it is not competing with the panel's
 * own movement, and stays below it in the stacking order.
 */
export const sidebarBackdropThemeVariants = cva(
    `
        absolute inset-0 z-40
        bg-black/50
        transition-opacity duration-(--mona-motion-standard) ease-out
        motion-reduce:transition-none
    `,
    {
        variants: {
            open: {
                true: "opacity-100",
                false: "opacity-0 pointer-events-none"
            }
        }
    }
);

export const sidebarMenuBadgeThemeVariants = cva(
    `
        ms-auto flex items-center justify-center shrink-0
        min-w-5 h-5 px-1.5
        rounded-md text-xs font-medium tabular-nums
        bg-(--color-sidebar-accent) text-(--color-sidebar-accent-foreground)
        pointer-events-none select-none
    `,
    {
        variants: {
            hidden: {
                true: "hidden!",
                false: ""
            }
        }
    }
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
            // The rail sits on the sidebar's inner edge, which is the opposite one to the side it is
            // docked against. Logical, so it stays on the inner edge under RTL.
            side: {
                start: "end-0",
                end: "start-0"
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
