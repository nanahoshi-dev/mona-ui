import { cva } from "class-variance-authority";

export const pagerBaseVariants = cva(
    `
        flex px-2 py-1
        text-sm
        bg-surface-muted text-foreground
        border border-border-subtle
        [&_mona-numeric-text-box]:ml-4
        [&_mona-numeric-text-box]:w-12
        [&_mona-numeric-text-box_input]:bg-input-background
        [&_mona-numeric-text-box_input]:text-center
        [&_mona-dropdown-list]:mx-1
        [&_mona-dropdown-list]:my-0
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-base"
            }
        }
    }
);

export const pagerInfoVariants = cva(
    `
        flex flex-1 items-center justify-end pl-2
        whitespace-nowrap text-muted-foreground
    `
);
export const pagerInputVariants = cva(
    `
        flex items-center
        [&_mona-numeric-text-box]:mx-1
        [&_mona-numeric-text-box]:w-12
    `
);

export const pagerListVariants = cva(
    `
        flex flex-wrap
        [&_li]:flex [&_li]:list-none
        [&_li]:items-center [&_li]:justify-center
    `
);

export const pagerListItemVariants = cva("", {
    variants: {
        active: {
            true: "font-semibold text-foreground",
            false: ""
        }
    },
    defaultVariants: {
        active: false
    }
});
