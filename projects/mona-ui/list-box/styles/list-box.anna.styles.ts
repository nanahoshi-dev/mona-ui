import { cva } from "class-variance-authority";

export const listBoxBaseVariants = cva(
    `
        flex gap-1
        [&_mona-list-view]:w-full
    `,
    {
        variants: {
            direction: {
                horizontal: "flex-row",
                vertical: "flex-col"
            },
            reversed: {
                true: "",
                false: ""
            },
            rounded: {
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                none: "rounded-none"
            },
            size: {
                small: "text-sm",
                medium: "text-base",
                large: "text-lg"
            }
        },
        compoundVariants: [
            {
                direction: "horizontal",
                reversed: true,
                class: "flex-row-reverse"
            },
            {
                direction: "vertical",
                reversed: true,
                class: "flex-col-reverse"
            }
        ]
    }
);

export const listBoxToolbarVariants = cva(
    `
        flex gap-1
        items-center justify-center
    `,
    {
        variants: {
            direction: {
                horizontal: "flex-row",
                vertical: "flex-col"
            }
        }
    }
);
