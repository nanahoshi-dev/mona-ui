import { cva } from "class-variance-authority";

export const expansionPanelBaseVariants = cva(
    `
        block w-full bg-background overflow-hidden
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
        transition-border-b duration-200
        focus-visible:outline-primary/40 focus-visible:border-b-transparent
        focus-visible:ring-1 focus-visible:ring-primary/40
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
        transition-[grid-template-rows] duration-300 ease-out
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
