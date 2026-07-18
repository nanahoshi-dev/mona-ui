import { cva } from "class-variance-authority";

export const dropdownListInputVariants = cva(
    `
        inline-flex items-center
        cursor-pointer select-none
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control) outline-none
        transition-[color,box-shadow,border] duration-300 ease-in-out
        data-[readonly='true']:cursor-default
        hover:bg-hover active:bg-active
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
    `,
    {
        variants: {
            disabled: {
                true: `
                    pointer-events-none cursor-not-allowed
                    bg-disabled-background text-disabled-foreground
                    border-disabled-border shadow-none
                `,
                false: ""
            },
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
                false: ""
            },
            hasPrefix: {
                false: "ps-2"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35 focus-within:border-error focus-within:ring-error/35",
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
        },
        compoundVariants: [
            {
                expanded: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ]
    }
);

export const dropdownListValueContainerVariants = cva(`flex h-full w-full items-center overflow-hidden`, {
    variants: {
        hasTemplate: {
            false: "[&>span]:truncate [&>span]:items-center [&>span]:inline-block"
        }
    }
});

export const dropdownListAffixContainerVariants = cva(`flex h-full flex-none items-center justify-center`);
