import { cva } from "class-variance-authority";

export const sliderBaseVariants = cva(
    `
        flex relative select-none

        data-[orientation="horizontal"]:h-15
        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:items-center

        data-[orientation="vertical"]:w-15
        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:justify-center

        data-[disabled="true"]:pointer-events-none
        data-[disabled="true"]:opacity-50
        data-[disabled="true"]:cursor-not-allowed
    `
);

export const sliderTrackVariants = cva(
    `
        relative z-2 cursor-pointer
        border border-input-border
        bg-background

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-1.5

        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:w-1.5

    `
);

export const sliderSelectionVariants = cva(
    `
        absolute
        bg-primary border-none

        ease-out duration-200

        data-[orientation="horizontal"]:left-0
        data-[orientation="horizontal"]:top-0
        data-[orientation="horizontal"]:bottom-0
        data-[orientation="horizontal"]:transition-[width]
        data-[orientation="horizontal"]:data-[dragging="true"]:transition-none

        data-[orientation="vertical"]:left-0
        data-[orientation="vertical"]:top-0
        data-[orientation="vertical"]:right-0
        data-[orientation="vertical"]:transition-[height]
        data-[orientation="vertical"]:data-[dragging="true"]:transition-none
    `
);

export const sliderTickListVariants = cva(
    `
        grid absolute

        data-[orientation="horizontal"]:w-full
        data-[orientation="horizontal"]:h-4.25
        data-[orientation="horizontal"]:grid-flow-col
        data-[orientation="horizontal"]:grid-cols-[minmax(0, 1fr)]
        data-[orientation="horizontal"]:items-center

        data-[orientation="vertical"]:w-4.25
        data-[orientation="vertical"]:h-full
        data-[orientation="vertical"]:grid-flow-row
        data-[orientation="vertical"]:grid-rows-[minmax(0, 1fr)]
    `
);

export const sliderTickVariants = cva(
    `
        flex
        [&>span]:flex-1
        [&>span]:cursor-pointer

        data-[orientation="horizontal"]:h-full
        data-[orientation="horizontal"]:first:border-l
        data-[orientation="horizontal"]:first:border-l-border
        data-[orientation="horizontal"]:even:border-r
        data-[orientation="horizontal"]:even:border-r-border

        data-[orientation="vertical"]:flex-col
        data-[orientation="vertical"]:first:border-l-none
        data-[orientation="vertical"]:first:border-t
        data-[orientation="vertical"]:first:border-t-border
        data-[orientation="vertical"]:even:border-r-none
        data-[orientation="vertical"]:even:border-b
        data-[orientation="vertical"]:even:border-b-border
    `
);

export const sliderTickLabelListVariants = cva(
    `
        absolute
        w-full h-full
        flex justify-between
        select-none

        data-[orientation="horizontal"]:flex-row
        data-[orientation="vertical"]:flex-col

        data-[label-position="after"]:items-end
        data-[label-position="before"]:items-start
    `
);

export const sliderTickLabelVariants = cva(
    `
        relative flex
        items-center justify-center

        text-xs/[1.667]
        text-foreground

        data-[orientation="horizontal"]:w-0
        data-[orientation="horizontal"]:h-4.25

        data-[orientation="vertical"]:w-4.25
        data-[orientation="vertical"]:h-0
    `
);

export const sliderHandleVariants = cva(
    `
        absolute z-2
        w-4.25 h-4.25
        cursor-pointer
        outline-none
        bg-primary border border-border

        ease-out duration-200

        data-[orientation="horizontal"]:translate-x-[-50%]
        data-[orientation="horizontal"]:transition-[left]
        data-[orientation="horizontal"]:data-[dragging="true"]:transition-none

        data-[orientation="vertical"]:translate-y-[50%]
        data-[orientation="vertical"]:transition-[bottom]
        data-[orientation="vertical"]:data-[dragging="true"]:transition-none
    `
);
