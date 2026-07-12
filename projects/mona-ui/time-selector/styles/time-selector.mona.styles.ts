import { cva } from "class-variance-authority";

export const timeSelectorBaseVariants = cva(
    `
        flex flex-col w-full h-full overflow-hidden
        transition-[color,box-shadow,border,background-color] ease-in-out duration-150
        data-[invalid='true']:border data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none",
                false: ""
            },
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-md"
            }
        }
    }
);

export const timeSelectorFooterVariants = cva(
    `
        w-full flex items-center justify-end px-1 py-1 border-0 border-t border-input-border bg-accent
    `
);

export const timeSelectorHeaderVariants = cva(
    `
        flex bg-accent text-accent-foreground
        border-b border-input-border
        text-xs font-semibold uppercase
        [&>div]:flex-1 [&>div]:py-2 [&>div]:text-center
    `
);

export const timeSelectorInfoContainerVariants = cva(
    `
        flex items-center justify-between
        px-2 py-1 border-b border-input-border/40
        [&>span]:text-xs [&>span]:font-medium [&>span]:select-none
    `
);

export const timeSelectorListContainerVariants = cva(
    `
        flex flex-row w-full relative overflow-hidden
    `
);

export const timeSelectorListVariants = cva(
    `
        flex-1 overflow-y-auto h-full
        scrollbar-hide scroll-smooth
        snap-y snap-mandatory
        scrollbar-width:none
        select-none outline-none
        [&::-webkit-scrollbar]:hidden
        transition-colors ease-in-out duration-150
        focus-visible:bg-accent
        focus-within:bg-accent
    `,
    {
        variants: {
            size: {
                small: "h-24",
                medium: "h-32",
                large: "h-40"
            }
        }
    }
);

export const timeSelectorListItemVariants = cva(
    `
        flex items-center justify-center cursor-pointer
        snap-center relative z-10
        transition-[color,background-color] ease-in-out duration-150
    `,
    {
        variants: {
            selected: {
                true: "bg-primary text-primary-foreground",
                false: ""
            },
            size: {
                small: "h-6",
                medium: "h-7",
                large: "h-8"
            }
        },
        defaultVariants: {
            selected: false
        }
    }
);
