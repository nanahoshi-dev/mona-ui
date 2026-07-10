import { cva } from "class-variance-authority";

export const filterMenuBaseVariants = cva(
    `
        w-full flex flex-col
        p-1 gap-2
        bg-background-dark text-foreground border border-border
        shadow-lg
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
