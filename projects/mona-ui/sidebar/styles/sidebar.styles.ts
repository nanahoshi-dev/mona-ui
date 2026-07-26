import { cva } from "class-variance-authority";

export const sidebarCollapsibleThemeVariants = cva(
    `
        bg-transparent border-none ps-4 pe-2
        [&>div]:first:border-none
        [&>div]:first:bg-transparent
        [&>div]:first:hover:bg-accent
        [&>div]:first:py-0
        [&>div]:first:px-0
        [&>div]:first:rounded-md
    `
);

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

export const sidebarThemeVariants = cva(
    `
        flex flex-col shrink-0
        w-64 h-full
        border-r border-border
        bg-surface-raised overflow-hidden
    `
);
