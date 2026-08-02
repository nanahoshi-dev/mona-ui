import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";

export const segmentedContainerThemeVariants = cva(
    `
        inline-flex items-center gap-0.5
        ${themeControlSurfaceClasses}
        border border-input-border
        rounded-lg
        p-1
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        transition-colors duration-(--mona-motion-fast)
    `
);

export const segmentedOptionThemeVariants = cva(
    `
        relative flex flex-1 cursor-pointer items-center justify-center gap-1
        whitespace-nowrap
        rounded-md
        transition-colors duration-(--mona-motion-fast)
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground
        data-[selected='true']:shadow-sm data-[selected='true']:ring-1 data-[selected='true']:ring-selected-border
        data-[selected='false']:text-muted-foreground
        data-[selected='false']:hover:bg-hover data-[selected='false']:hover:text-foreground
    `,
    {
        variants: {
            size: {
                small: "h-6 px-1.5 text-sm",
                medium: "h-8 px-2.5 text-sm",
                large: "h-10 px-3.5 text-base"
            }
        },
        defaultVariants: {
            size: "medium"
        }
    }
);

export const segmentedInputThemeVariants = cva(
    `
        peer absolute inset-0 z-10 h-full w-full
        cursor-pointer appearance-none opacity-0
        outline-none
        disabled:cursor-not-allowed
    `
);

export type SegmentedContainerVariantProps = VariantProps<typeof segmentedContainerThemeVariants>;

export type SegmentedContainerVariantInput = VariantInputs<SegmentedContainerVariantProps>;

export type SegmentedOptionVariantProps = VariantProps<typeof segmentedOptionThemeVariants>;

export type SegmentedOptionVariantInput = VariantInputs<SegmentedOptionVariantProps>;

export type SegmentedVariantProps = SegmentedContainerVariantProps & SegmentedOptionVariantProps;

export type SegmentedVariantInput = SegmentedContainerVariantInput & SegmentedOptionVariantInput;
