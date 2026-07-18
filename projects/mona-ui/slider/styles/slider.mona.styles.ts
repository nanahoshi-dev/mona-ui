import { cva } from "class-variance-authority";

export const sliderBaseVariants = cva(
    `
        relative flex select-none

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-6
        data-[orientation="horizontal"]:min-w-[200px]
        data-[orientation="horizontal"]:items-center

        data-[orientation="vertical"]:h-[200px]
        data-[orientation="vertical"]:w-6
        data-[orientation="vertical"]:justify-center

        data-[disabled="true"]:pointer-events-none
        data-[disabled="true"]:cursor-not-allowed
        data-[disabled="true"]:opacity-50
    `
);

export const sliderTrackVariants = cva(
    `
        relative z-2 cursor-pointer
        overflow-hidden
        bg-surface-muted text-foreground

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-1.5

        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:w-1.5

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

export const sliderSelectionVariants = cva(
    `
        absolute
        bg-primary
        border-none
        transition duration-200 ease-out

        data-[orientation="horizontal"]:top-0
        data-[orientation="horizontal"]:bottom-0
        data-[orientation="horizontal"]:transition-[left,right]
        data-[orientation="horizontal"]:data-[dragging="true"]:transition-none

        data-[orientation="vertical"]:left-0
        data-[orientation="vertical"]:right-0
        data-[orientation="vertical"]:transition-[top,bottom]
        data-[orientation="vertical"]:data-[dragging="true"]:transition-none
    `
);

export const sliderTickListVariants = cva(
    `
        absolute

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-6
        data-[orientation="horizontal"]:top-0
        data-[orientation="horizontal"]:left-0

        data-[orientation="vertical"]:w-6
        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:top-0
        data-[orientation="vertical"]:left-0
    `
);

export const sliderTickVariants = cva(
    `
        cursor-pointer
        bg-border-control-hover
    `
);

export const sliderTickLabelListVariants = cva(
    `
        absolute h-full w-full
        select-none
    `
);

export const sliderTickLabelVariants = cva(
    `
        absolute flex items-center justify-center
        text-xs/[1.667] text-foreground

        data-[orientation="vertical"]:h-auto
        data-[orientation="vertical"]:w-4.25
    `
);

export const sliderHandleVariants = cva(
    `
        absolute z-2 flex items-center justify-center
        h-4.25 w-4.25
        cursor-pointer
        bg-surface-raised
        border border-focus-indicator/50 shadow-(--shadow-control)
        outline-none
        transition duration-200 ease-out

        data-[orientation="horizontal"]:translate-x-[-50%]
        data-[orientation="horizontal"]:transition-[left]
        data-[orientation="horizontal"]:data-[dragging="true"]:transition-none

        data-[orientation="vertical"]:translate-y-[50%]
        data-[orientation="vertical"]:transition-[bottom]
        data-[orientation="vertical"]:data-[dragging="true"]:transition-none

        data-[focused="true"]:border-focus-indicator
        data-[focused="true"]:ring-2
        data-[focused="true"]:ring-focus-indicator/35

        data-[invalid="true"]:border-error
        data-[invalid="true"]:ring-2 data-[invalid="true"]:ring-error/35
        data-[invalid="true"]:data-[focused="true"]:border-error
        data-[invalid="true"]:data-[focused="true"]:ring-error/35
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
