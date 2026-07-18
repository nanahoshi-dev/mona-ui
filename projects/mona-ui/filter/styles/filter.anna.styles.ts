import { cva } from "class-variance-authority";

export const filterMenuBaseVariants = cva(
    `
        flex w-full flex-col
        gap-2 p-1
        bg-surface-overlay text-foreground
        border border-border shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]"
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
