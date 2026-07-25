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

export const sidebarThemeVariants = cva(
    `
        flex flex-col shrink-0
        w-64 h-full
        border-r border-border
        bg-accent/30 overflow-hidden
    `
);
