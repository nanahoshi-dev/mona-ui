import { cva } from "class-variance-authority";

export const tooltipBaseVariants = cva(
    `
        relative z-1 flex items-center justify-center
        bg-primary text-primary-foreground
        border border-primary shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            }
        }
    }
);

export const tooltipArrowVariants = cva(
    `
        absolute z-0 h-3 w-3 rotate-45 transform-center box-border
        pointer-events-none
        bg-primary text-primary-foreground
        border border-primary

        data-[position="top"]:-bottom-1.5
        data-[position="top"]:border-t-0
        data-[position="top"]:border-l-0
        data-[position="top"]:[clip-path:inset(1px_0_0_1px)]

        data-[position="bottom"]:-top-1.5
        data-[position="bottom"]:border-b-0
        data-[position="bottom"]:border-r-0
        data-[position="bottom"]:[clip-path:inset(0_1px_1px_0)]

        data-[position="left"]:-right-1.5
        data-[position="left"]:border-l-0
        data-[position="left"]:border-b-0
        data-[position="left"]:[clip-path:inset(0_0_1px_1px)]

        data-[position="right"]:-left-1.5
        data-[position="right"]:border-r-0
        data-[position="right"]:border-t-0
        data-[position="right"]:[clip-path:inset(1px_1px_0_0)]
    `
);
