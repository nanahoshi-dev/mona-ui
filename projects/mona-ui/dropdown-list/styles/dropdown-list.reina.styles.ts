import { cva } from "class-variance-authority";

export const reinaDropdownListInputVariants = cva(
    `
        inline-flex items-center

        border border-input-border
        bg-input-background outline-none
        text-foreground shadow-xs
        cursor-pointer select-none

        hover:bg-input-hover
        transition-[color,box-shadow,border,background-color] ease-out duration-150
        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-40",
                false: ""
            },
            expanded: {
                true: "ring-2 ring-primary/35 border-primary",
                false: ""
            },
            hasPrefix: {
                false: "ps-2"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35",
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

export const reinaDropdownListValueContainerVariants = cva(`overflow-hidden h-full w-full flex items-center`, {
    variants: {
        hasTemplate: {
            false: "[&>span]:truncate [&>span]:items-center [&>span]:inline-block"
        }
    }
});

export const reinaDropdownListAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
