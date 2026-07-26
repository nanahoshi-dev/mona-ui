import { cva } from "class-variance-authority";

export const sidebarLayoutBaseThemeVariants = cva(
    `
        flex flex-row w-full h-screen h-dvh
        overflow-hidden
    `
);

export const sidebarLayoutContentThemeVariants = cva(
    `
        flex flex-col grow flex-1 items-center justify-center
        h-full
    `
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
            }
        }
    }
);

export const sidebarMenuSubThemeVariants = cva(
    `
        flex flex-col w-full space-y-1
        ms-3.5 ps-2.5
        border-l border-border
    `
);

export const sidebarThemeVariants = cva(
    `
        flex flex-col shrink-0
        w-64 h-full
        border-r border-border
        bg-surface-raised overflow-hidden
    `
);
