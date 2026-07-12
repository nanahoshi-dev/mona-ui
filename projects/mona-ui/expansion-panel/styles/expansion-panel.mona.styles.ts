import { cva } from "class-variance-authority";

export const expansionPanelBaseVariants = cva(
    `
        block w-full bg-surface overflow-hidden
        border border-border text-foreground
        not-last:border-b-transparent not-last:rounded-b-none
        not-first:rounded-t-none relative
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

export const expansionPanelHeaderVariants = cva(
    `
        w-full flex items-center justify-between
        px-2 py-1
        bg-background-dark
        cursor-pointer
        font-medium
        text-foreground
        select-none
        transition-[border-color,box-shadow,background-color] duration-150 ease-in-out motion-reduce:transition-none
        focus-visible:outline-focus-indicator focus-visible:border-b-transparent
        focus-visible:ring-1 focus-visible:ring-focus-indicator/35
        focus-visible:z-10 focus-visible:relative
    `,
    {
        variants: {
            collapsed: {
                true: "border-b-transparent",
                false: "border-0 border-b border-border border-solid"
            },
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed select-none",
                false: ""
            }
        }
    }
);

export const expansionPanelHeaderTitleVariants = cva(
    `
        p-1 flex-1
    `
);

export const expansionPanelIconContainerVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "px-2"
        }
    }
});

export const expansionPanelContentVariants = cva(
    `
        text-foreground
        grid
        transition-[grid-template-rows] duration-150 ease-in-out motion-reduce:transition-none
        [&>div]:overflow-hidden
    `,
    {
        variants: {
            expanded: {
                true: "grid-rows-[1fr]",
                false: "grid-rows-[0fr]"
            }
        }
    }
);
