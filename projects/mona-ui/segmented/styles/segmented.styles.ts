import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";

export const segmentedContainerThemeVariants = cva(
    `
        relative inline-flex items-center gap-0.5
        ${themeControlSurfaceClasses}
        border border-input-border
        p-1
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        transition-colors duration-(--mona-motion-fast)
    `,
    {
        variants: {
            alignment: {
                start: "justify-start",
                center: "justify-center",
                end: "justify-end",
                stretch: "justify-stretch"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        },
        defaultVariants: {
            alignment: "stretch",
            rounded: "medium"
        }
    }
);

export const segmentedOptionThemeVariants = cva(
    `
        relative flex cursor-pointer items-center justify-center gap-1
        whitespace-nowrap
        transition-colors duration-(--mona-motion-fast)
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[disabled='true']:text-disabled-foreground
        data-[selected='true']:text-primary-foreground
        data-[selected='false']:text-muted-foreground
        data-[selected='false']:hover:bg-hover data-[selected='false']:hover:text-foreground
        data-[disabled='true']:data-[selected='false']:text-disabled-foreground
        data-[selected='true']:transition-none
    `,
    {
        variants: {
            alignment: {
                start: "flex-none",
                center: "flex-none",
                end: "flex-none",
                stretch: "flex-1"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-xs",
                medium: "rounded-sm",
                large: "rounded-md",
                full: "rounded-full"
            },
            size: {
                small: "h-6 px-1.5 text-sm",
                medium: "h-8 px-2.5 text-sm",
                large: "h-10 px-3.5 text-base"
            }
        },
        defaultVariants: {
            alignment: "stretch",
            rounded: "medium",
            size: "medium"
        }
    }
);

export const segmentedIndicatorThemeVariants = cva(
    `
        pointer-events-none absolute top-0 left-0
        bg-primary shadow-sm ring-1 ring-selected-border
        data-[disabled='true']:opacity-50
        motion-reduce:transition-none
    `,
    {
        variants: {
            animate: {
                true: "transition-[transform,width,height] duration-(--mona-motion-fast) ease-out",
                false: "transition-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-xs",
                medium: "rounded-sm",
                large: "rounded-md",
                full: "rounded-full"
            }
        },
        defaultVariants: {
            animate: true,
            rounded: "medium"
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

export type SegmentedIndicatorVariantProps = VariantProps<typeof segmentedIndicatorThemeVariants>;

export type SegmentedIndicatorVariantInput = VariantInputs<SegmentedIndicatorVariantProps>;

export type SegmentedVariantProps = SegmentedContainerVariantProps & SegmentedOptionVariantProps;

export type SegmentedVariantInput = SegmentedContainerVariantInput & SegmentedOptionVariantInput;
