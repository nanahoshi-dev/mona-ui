import { cva } from "class-variance-authority";

export const popoverBaseVariants = cva(
    `
        relative z-1 flex flex-col items-center justify-center
        bg-surface-overlay text-foreground
        border border-border shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]
    `,
    {
        variants: {
            rounded: {
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            }
        }
    }
);

export const popoverHeaderVariants = cva(
    `
        flex w-full items-center justify-between overflow-hidden
        font-semibold
    `,
    {
        variants: {
            rounded: {
                large: "rounded-t-lg",
                medium: "rounded-t-md",
                none: "rounded-t-none",
                small: "rounded-t-sm"
            }
        }
    }
);

export const popoverContentVariants = cva(
    `
        h-full w-full flex-1 overflow-hidden
    `
);

export const popoverArrowVariants = cva(
    `
        absolute z-0 h-3 w-3 rotate-45 transform-center box-border
        pointer-events-none
        bg-surface-overlay text-foreground
        border border-border
        data-[position="top"]:-bottom-1.5 data-[position="top"]:border-t-0 data-[position="top"]:border-l-0
        data-[position="top"]:[clip-path:inset(1px_0_0_1px)]
        data-[position="bottom"]:-top-1.5 data-[position="bottom"]:border-r-0 data-[position="bottom"]:border-b-0
        data-[position="bottom"]:[clip-path:inset(0_1px_1px_0)]
        data-[position="left"]:-right-1.5 data-[position="left"]:border-b-0 data-[position="left"]:border-l-0
        data-[position="left"]:[clip-path:inset(0_0_1px_1px)]
        data-[position="right"]:-left-1.5 data-[position="right"]:border-t-0 data-[position="right"]:border-r-0
        data-[position="right"]:[clip-path:inset(1px_1px_0_0)]
    `
);
