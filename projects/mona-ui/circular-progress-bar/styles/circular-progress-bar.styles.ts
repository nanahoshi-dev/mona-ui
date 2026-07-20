import { cva } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

export const circularProgressBarBaseThemeVariants = cva(
    `
        relative flex items-center justify-center select-none
        text-foreground
        [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:left-1/2
        [&_svg]:h-full [&_svg]:w-full
        [&_svg]:-translate-x-1/2 [&_svg]:-translate-y-1/2
        [&_svg_circle]:origin-center
        [&_svg_circle]:-rotate-90
        [&_svg_circle]:transition-[stroke-dashoffset,stroke] duration-(--mona-motion-fast) ease-in
        [&_svg_circle]:data-[stroke-trail='true']:stroke-surface-muted
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-50",
                false: ""
            }
        }
    }
);

type CircularProgressBarBaseVariantProps = VariantProps<typeof circularProgressBarBaseThemeVariants>;

export type CircularProgressBarBaseVariantInput = VariantInputs<CircularProgressBarBaseVariantProps>;

export type CircularProgressBarVariantProps = CircularProgressBarBaseVariantProps;

export type CircularProgressBarVariantInput = CircularProgressBarBaseVariantInput;
