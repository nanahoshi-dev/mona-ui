import { cva } from "class-variance-authority";

export const dropdownListInputVariants = cva(
    `
        inline-flex items-center

        border border-input-border
        bg-background outline-none
        shadow-xs
        cursor-pointer select-none

        hover:bg-accent hover:text-accent-foreground
        transition-[color,box-shadow,border] ease-in-out duration-300
        focus-within:ring-1 focus-within:ring-primary/40
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-50",
                false: ""
            },
            expanded: {
                true: "ring-1 ring-primary/40",
                false: ""
            },
            hasPrefix: {
                false: "ps-2"
            },
            invalid: {
                true: "border-error ring-1 ring-error/40",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full px-3"
            },
            size: {
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

export const dropdownListValueContainerVariants = cva(`overflow-hidden h-full w-full flex items-center`, {
    variants: {
        hasTemplate: {
            false: "[&>span]:truncate [&>span]:items-center [&>span]:inline-block"
        }
    }
});

export const dropdownListAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
