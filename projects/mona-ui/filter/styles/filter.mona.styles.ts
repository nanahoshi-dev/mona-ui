import { cva } from "class-variance-authority";

export const filterMenuBaseVariants = cva(
    `
        flex w-full flex-col
        gap-2 p-1
        bg-surface-overlay text-foreground
        border border-border shadow-md
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            },
            size: {
                small: "",
                medium: "",
                large: ""
            }
        }
    }
);

export const filterMenuItemVariants = cva(
    `
        flex flex-col gap-1
        [&>mona-button-group>button]:flex-1
    `
);

export const filterMenuActionVariants = cva(
    `
        flex flex-row
        items-center justify-center
        gap-1 [&>button]:flex-1
    `
);
