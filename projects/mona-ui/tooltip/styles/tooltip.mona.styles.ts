import { cva } from "class-variance-authority";

export const tooltipBaseVariants = cva(
    `
        flex items-center justify-center relative
        bg-background text-foreground border border-border
        shadow-[0_2px_8px_rgba(0,0,0,0.12)] z-1
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
        z-0 bg-background text-foreground

        border border-border

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
