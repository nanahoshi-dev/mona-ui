import { cva } from "class-variance-authority";

export const expansionPanelBaseVariants = cva(
    `
        relative block w-full overflow-hidden
        bg-surface text-foreground border border-border
        not-last:border-b-transparent not-last:rounded-b-none not-first:rounded-t-none
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
        relative flex w-full items-center justify-between
        px-2 py-1
        cursor-pointer
        select-none
        font-medium text-foreground
        bg-surface-muted
        transition-colors duration-150
        hover:bg-hover active:bg-active
        focus-visible:z-10 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            collapsed: {
                true: "border-b-transparent",
                false: "border-0 border-b border-border-subtle"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none bg-disabled-background text-disabled-foreground",
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
        transition-[grid-template-rows] duration-150 ease-out
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
