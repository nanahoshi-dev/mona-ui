import { cva } from "class-variance-authority";

export const reinaCircularProgressBarBaseVariants = cva(
    `
        flex items-center justify-center
        relative select-none
        [&_svg]:w-full [&_svg]:h-full
        [&_svg]:absolute [&_svg]:top-1/2
        [&_svg]:left-1/2
        [&_svg]:-translate-x-1/2 [&_svg]:-translate-y-1/2
        [&_svg_circle]:origin-center
        [&_svg_circle]:-rotate-90
        [&_svg_circle]:transition-[stroke-dashoffset,stroke] duration-150 ease-out
        [&_svg_circle]:data-[stroke-trail='true']:stroke-input-border
    `,
    {
        variants: {
            disabled: {
                true: "opacity-40 pointer-events-none cursor-not-allowed",
                false: ""
            }
        }
    }
);
