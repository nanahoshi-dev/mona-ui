import { cva } from "class-variance-authority";

export const reinaSliderBaseVariants = cva(
    `
        flex relative select-none

        data-[orientation="horizontal"]:h-6
        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:min-w-[200px]
        data-[orientation="horizontal"]:items-center

        data-[orientation="vertical"]:w-6
        data-[orientation="vertical"]:h-[200px]
        data-[orientation="vertical"]:justify-center

        data-[disabled="true"]:pointer-events-none
        data-[disabled="true"]:opacity-40
        data-[disabled="true"]:cursor-not-allowed
    `
);

export const reinaSliderTrackVariants = cva(
    `
        relative z-2 cursor-pointer
        border border-input-border
        bg-input-background text-foreground

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-1.5

        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:w-1.5

    `
);

export const reinaSliderSelectionVariants = cva(
    `
        absolute
        bg-primary border-none

        ease-out duration-150

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

export const reinaSliderTickListVariants = cva(
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

export const reinaSliderTickVariants = cva(
    `
        cursor-pointer
        bg-input-border
    `
);

export const reinaSliderTickLabelListVariants = cva(
    `
        absolute
        w-full h-full
        select-none
    `
);

export const reinaSliderTickLabelVariants = cva(
    `
        absolute flex
        items-center justify-center

        text-xs/[1.667]
        text-foreground

        data-[orientation="vertical"]:w-4.25
        data-[orientation="vertical"]:h-auto
    `
);

export const reinaSliderHandleVariants = cva(
    `
        absolute z-2 flex items-center justify-center
        w-4.25 h-4.25
        cursor-pointer
        outline-none
        bg-primary border border-border

        ease-out duration-150

        data-[orientation="horizontal"]:translate-x-[-50%]
        data-[orientation="horizontal"]:transition-[left]
        data-[orientation="horizontal"]:data-[dragging="true"]:transition-none

        data-[orientation="vertical"]:translate-y-[50%]
        data-[orientation="vertical"]:transition-[bottom]
        data-[orientation="vertical"]:data-[dragging="true"]:transition-none

        data-[focused="true"]:ring-2
        data-[focused="true"]:ring-primary/35

        data-[invalid="true"]:border-error
        data-[invalid="true"]:ring-2 data-[invalid="true"]:ring-error/35
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
