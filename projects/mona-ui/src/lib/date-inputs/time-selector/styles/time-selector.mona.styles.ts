import { cva } from "class-variance-authority";

export const timeSelectorBaseVariants = cva(
    `
        flex flex-col w-full h-full overflow-hidden
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
        scrollbar-width:none select-none
        [&::-webkit-scrollbar]:hidden
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
    `,
    {
        variants: {
            selected: {
                true: "bg-primary text-primary-foreground",
                false: ""
            },
            size: {
                small: "h-8",
                medium: "h-9",
                large: "h-10"
            }
        },
        defaultVariants: {
            selected: false
        }
    }
);
