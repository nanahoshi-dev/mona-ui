import { cva } from "class-variance-authority";

export const sidebarLayoutBaseThemeVariants = cva(
    `
        flex flex-row w-full h-screen h-dvh
        overflow-hidden
    `
);

export const sidebarInsetThemeVariants = cva(
    `
        flex flex-col grow flex-1 min-w-0
        h-full overflow-auto
    `,
    {
        variants: {
            variant: {
                sidebar: "",
                floating: "",
                // The `inset` variant moves the raised surface from the sidebar onto this region.
                inset: "m-2 rounded-lg border border-border bg-surface shadow-sm"
            }
        }
    }
);

export const sidebarGroupHeaderThemeVariants = cva(
    `
        flex items-center
    `,
    {
        variants: {
            // On the rail the label and any action have stood down, so the row would only reserve empty space.
            iconOnly: {
                true: "h-0 overflow-hidden",
                false: "h-8 px-3"
            }
        }
    }
);

export const sidebarGroupLabelThemeVariants = cva(
    `
        flex grow-1 items-center shrink-0
        text-xs font-medium text-foreground/80
    ` // TODO: Introduce --color-sidebar-foreground
);

export const sidebarMenuItemThemeVariants = cva(
    `
        flex text-base gap-1
        group/menu-item
    `,
    {
        variants: {
            collapsible: {
                true: "flex-col items-stretch",
                false: "flex-row items-center rounded-md hover:bg-accent"
            },
            iconOnly: {
                true: "w-8 justify-center",
                false: ""
            }
        },
        compoundVariants: [
            // On the rail a collapsible item has nothing left to stack, so it behaves like any other row.
            { collapsible: true, iconOnly: true, class: "flex-row items-center rounded-md hover:bg-accent" }
        ]
    }
);

export const sidebarMenuSubThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
        ms-3.5 ps-2.5
        border-l border-border
    `
);

export const sidebarMenuThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
    `,
    {
        variants: {
            iconOnly: {
                true: "px-2 items-center",
                false: "ps-4 pe-2"
            }
        }
    }
);

export const sidebarThemeVariants = cva(
    `
        relative flex flex-col shrink-0
        h-full
        bg-surface-raised overflow-hidden
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
                sidebar: "",
                floating: "m-2 rounded-lg border border-border shadow-sm",
                inset: "m-2 bg-transparent"
            },
            // Once an offcanvas sidebar is fully collapsed any margin would leave a visible gutter.
            flush: {
                true: "m-0",
                false: ""
            }
        },
        compoundVariants: [
            { variant: "sidebar", side: "left", class: "border-r border-border" },
            { variant: "sidebar", side: "right", class: "border-l border-border" }
        ]
    }
);

export const sidebarMenuBadgeThemeVariants = cva(
    `
        ms-auto flex items-center justify-center shrink-0
        min-w-5 h-5 px-1.5
        rounded-md text-xs font-medium tabular-nums
        bg-accent text-foreground
        pointer-events-none select-none
    `
);

export const sidebarRailThemeVariants = cva(
    `
        absolute inset-y-0 z-20 hidden w-1
        cursor-pointer
        transition-colors hover:bg-border
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
        shrink-0 h-px bg-border
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
