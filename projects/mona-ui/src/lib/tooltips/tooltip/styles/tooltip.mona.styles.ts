import { cva } from "class-variance-authority";

export const tooltipBaseVariants = cva(
    `
        flex items-center justify-center relative
        bg-background border border-border
        shadow-sm z-1
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const tooltipArrowVariants = cva(
    `
        absolute w-3 h-3 box-border
        pointer-events-none
        transform-center rotate-45
        z-0 bg-background

        data-[position="top"]:-bottom-1.5
        data-[position="top"]:border-r
        data-[position="top"]:border-b
        data-[position="top"]:border-r-border
        data-[position="top"]:border-b-border
        data-[position="top"]:[clip-path:inset(0_1px_1px_0]]

        data-[position="bottom"]:-top-1.5
        data-[position="bottom"]:border-l
        data-[position="bottom"]:border-t
        data-[position="bottom"]:border-l-border
        data-[position="bottom"]:border-t-border
        data-[position="bottom"]:[clip-path:inset(1px_0_0_1px]]

        data-[position="left"]:-right-1.5
        data-[position="left"]:border-t
        data-[position="left"]:border-r
        data-[position="left"]:border-t-border
        data-[position="left"]:border-r-border
        data-[position="left"]:[clip-path:inset(1px_1px_0_0]]

        data-[position="right"]:-left-1.5
        data-[position="right"]:border-b
        data-[position="right"]:border-l
        data-[position="right"]:border-b-border
        data-[position="right"]:border-l-border
        data-[position="right"]:[clip-path:inset(0_0_1px_1px]]
    `
);
