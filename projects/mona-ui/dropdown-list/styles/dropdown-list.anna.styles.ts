import { cva } from "class-variance-authority";

export const dropdownListInputVariants = cva(
    `
        inline-flex items-center
        cursor-pointer select-none
        bg-input-background text-foreground
        border border-input-border shadow-none outline-none
        transition-[color,box-shadow,border] duration-150 ease-in-out
        data-[readonly='true']:cursor-default
        hover:bg-hover active:bg-active
        focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator
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
                true: "border-focus-indicator ring-2 ring-focus-indicator",
                false: ""
            },
            hasPrefix: {
                false: "ps-2"
            },
            invalid: {
                true: "border-error ring-2 ring-error focus-visible:border-error focus-visible:ring-error",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full px-3"
            },
            size: {
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
            }
        },
        compoundVariants: [
            {
                expanded: true,
                invalid: true,
                class: "border-error ring-error"
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
