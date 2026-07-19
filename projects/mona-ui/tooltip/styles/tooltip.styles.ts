import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const tooltipBaseThemeVariants = cva(
    `
        relative z-1 flex items-center justify-center
        bg-surface-overlay text-foreground
        border border-border shadow-(--shadow-overlay)
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

export const tooltipArrowThemeVariants = cva(
    `
        absolute z-0 h-3 w-3 rotate-45 transform-center box-border
        pointer-events-none
        bg-surface-overlay
        border border-border shadow-(--shadow-overlay)

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

type TooltipBaseVariantProps = VariantProps<typeof tooltipBaseThemeVariants>;

type TooltipBaseVariantInputs = VariantInputs<TooltipBaseVariantProps>;

type TooltipArrowVariantsProps = VariantProps<typeof tooltipArrowThemeVariants>;

type TooltipArrowVariantsInputs = VariantInputs<TooltipArrowVariantsProps>;

export type TooltipVariantProps = TooltipBaseVariantProps & TooltipArrowVariantsProps;

export type TooltipVariantInputs = TooltipBaseVariantInputs & TooltipArrowVariantsInputs;
