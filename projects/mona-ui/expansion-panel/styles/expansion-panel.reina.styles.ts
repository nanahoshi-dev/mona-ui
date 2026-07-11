import { cva } from "class-variance-authority";

export const reinaExpansionPanelBaseVariants = cva(
    `
        block w-full bg-background overflow-hidden
        border border-border/60 text-foreground
        not-last:border-b-transparent not-last:rounded-b-none
        not-first:rounded-t-none relative
    `,
    {
        variants: {
            rounded: {
                small: "rounded-md",
                medium: "rounded-xl",
                large: "rounded-2xl",
                none: "rounded-none"
            }
        }
    }
);

export const reinaExpansionPanelHeaderVariants = cva(
    `
        w-full flex items-center justify-between
        px-2 py-1
        bg-background-dark
        cursor-pointer
        font-medium
        text-foreground
        select-none
        transition-border-b duration-150 ease-out
        focus-visible:outline-primary/35 focus-visible:border-b-transparent
        focus-visible:ring-1 focus-visible:ring-primary/35
        focus-visible:z-10 focus-visible:relative
    `,
    {
        variants: {
            collapsed: {
                true: "border-b-transparent",
                false: "border-0 border-b border-border/60 border-solid"
            },
            disabled: {
                true: "pointer-events-none opacity-40 cursor-not-allowed select-none",
                false: ""
            }
        }
    }
);

export const reinaExpansionPanelHeaderTitleVariants = cva(
    `
        p-1 flex-1
    `
);

export const reinaExpansionPanelIconContainerVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "px-2"
        }
    }
});

export const reinaExpansionPanelContentVariants = cva(
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
