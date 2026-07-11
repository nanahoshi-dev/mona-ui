import { cva } from "class-variance-authority";

export const reinaScrollViewBaseVariants = cva(
    `
        block relative w-full h-full outline-none
        overflow-hidden
        border-2 border-border/60
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

export const reinaScrollViewContentVariants = cva(
    `
        absolute inset-0 overflow-hidden
    `
);

export const reinaScrollViewListVariants = cva(
    `
        relative list-none h-full
        [&_li]:absolute
        [&_li]:inset-0
        [&_li]:outline-none
    `
);

export const reinaScrollViewArrowVariants = cva(
    `
        absolute top-0 bottom-0 px-1
        flex items-center justify-center
        cursor-pointer select-none

        text-foreground
        [&_svg]:stroke-white
        [&_svg]:drop-shadow-[0_0_15px_#000]
        [&_svg]:opacity-40
        hover:[&_svg]:opacity-100
        [&_svg]:transition-opacity duration-300 ease-out
    `,
    {
        variants: {
            hidden: {
                true: "hidden",
                false: ""
            },
            left: {
                true: "left-0",
                false: ""
            },
            right: {
                true: "right-0",
                false: ""
            }
        }
    }
);

export const reinaScrollViewPagerVariants = cva(
    `
        absolute left-0 right-0 bottom-0 flex items-center justify-center
    `,
    {
        variants: {
            pagerOverlay: {
                dark: "border-0 border-t border-border/20 bg-background-dark/20",
                light: "border-0 border-t border-border/20 bg-background/20",
                none: ""
            }
        }
    }
);

export const reinaScrollViewPagerListContainerVariants = cva(
    `
        flex items-center justify-center
        flex-1 overflow-hidden
    `
);

export const reinaScrollViewPagerListVariants = cva(
    `
        flex items-center gap-2
        list-none overflow-hidden
        flex-nowrap px-1 py-3
    `
);

export const reinaScrollViewPagerListItemVariants = cva(
    `
        w-3 h-3
        content-[' ']
        flex-grow-0 flex-shrink-0 flex-basis-3
        cursor-pointer
        border border-border/60 bg-white
        not-last:mr-3
    `,
    {
        variants: {
            active: {
                true: "!bg-primary",
                false: ""
            },
            pagerRounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

export const reinaScrollViewPagerArrowVariants = cva(
    `
        flex items-center justify-center
        p-2 cursor-pointer select-none
        transition-opacity duration-300 ease-out
        opacity-70 hover:opacity-100
        font-medium
        [&_svg]:stroke-white
        [&_svg]:drop-shadow-[0_0_15px_#000]
        [&_svg]:opacity-40
        hover:[&_svg]:opacity-100
        [&_svg]:transition-opacity duration-300 ease-out
    `
);
