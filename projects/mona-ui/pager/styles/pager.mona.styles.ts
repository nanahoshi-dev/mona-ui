import { cva } from "class-variance-authority";

export const pagerBaseVariants = cva(
    `
        flex py-1 px-2
        bg-surface text-foreground
        border border-border
        text-sm
        [&_mona-numeric-text-box]:ml-4
        [&_mona-numeric-text-box]:w-12
        [&_mona-numeric-text-box_input]:text-center
        [&_mona-numeric-text-box_input]:bg-input-background

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
        flex items-center justify-end
        flex-1 pl-2 whitespace-nowrap
    `
);
export const pagerInputVariants = cva(
    `
        flex items-center
        [&_mona-numeric-text-box]:w-12
        [&_mona-numeric-text-box]:mx-1

    `
);

export const pagerListVariants = cva(
    `
        flex flex-wrap
        [&_li]:list-none
        [&_li]:flex
        [&_li]:items-center
        [&_li]:justify-center
    `
);

export const pagerListItemVariants = cva("", {
    variants: {
        active: {
            true: "font-semibold",
            false: ""
        }
    },
    defaultVariants: {
        active: false
    }
});
