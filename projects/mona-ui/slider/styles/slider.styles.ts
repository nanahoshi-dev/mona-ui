import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const sliderBaseThemeVariants = cva(
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

export const sliderTrackThemeVariants = cva(
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

export const sliderSelectionThemeVariants = cva(
    `
        absolute
        bg-primary
        border-none
        transition duration-(--mona-motion-fast) ease-out

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

export const sliderTickListThemeVariants = cva(
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

export const sliderTickThemeVariants = cva(
    `
        cursor-pointer
        bg-border-control-hover
    `
);

export const sliderTickLabelListThemeVariants = cva(
    `
        absolute h-full w-full
        select-none
    `
);

export const sliderTickLabelThemeVariants = cva(
    `
        absolute flex items-center justify-center
        text-xs/[1.667] text-foreground

        data-[orientation="vertical"]:h-auto
        data-[orientation="vertical"]:w-4.25
    `
);

export const sliderHandleThemeVariants = cva(
    `
        absolute z-2 flex items-center justify-center
        h-4.25 w-4.25
        cursor-pointer
        bg-surface-raised
        border border-(--mona-slider-handle-border-color) shadow-(--shadow-control)
        outline-none
        transition duration-(--mona-motion-fast) ease-out

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

export type SliderBaseVariantProps = VariantProps<typeof sliderBaseThemeVariants>;

export type SliderBaseVariantInputs = VariantInputs<SliderBaseVariantProps>;

export type SliderTrackVariantProps = VariantProps<typeof sliderTrackThemeVariants>;

export type SliderTrackVariantInputs = VariantInputs<SliderTrackVariantProps>;

export type SliderSelectionVariantProps = VariantProps<typeof sliderSelectionThemeVariants>;

export type SliderSelectionVariantInputs = VariantInputs<SliderSelectionVariantProps>;

export type SliderTickListVariantProps = VariantProps<typeof sliderTickListThemeVariants>;

export type SliderTickListVariantInputs = VariantInputs<SliderTickListVariantProps>;

export type SliderTickVariantProps = VariantProps<typeof sliderTickThemeVariants>;

export type SliderTickVariantInputs = VariantInputs<SliderTickVariantProps>;

export type SliderTickLabelListVariantProps = VariantProps<typeof sliderTickLabelListThemeVariants>;

export type SliderTickLabelListVariantInputs = VariantInputs<SliderTickLabelListVariantProps>;

export type SliderTickLabelVariantProps = VariantProps<typeof sliderTickLabelThemeVariants>;

export type SliderTickLabelVariantInputs = VariantInputs<SliderTickLabelVariantProps>;

export type SliderHandleVariantProps = VariantProps<typeof sliderHandleThemeVariants>;

export type SliderHandleVariantInputs = VariantInputs<SliderHandleVariantProps>;

export type SliderVariantProps = SliderBaseVariantProps &
    SliderTrackVariantProps &
    SliderSelectionVariantProps &
    SliderTickListVariantProps &
    SliderTickVariantProps &
    SliderTickLabelListVariantProps &
    SliderTickLabelVariantProps &
    SliderHandleVariantProps;

export type SliderVariantInputs = SliderBaseVariantInputs &
    SliderTrackVariantInputs &
    SliderSelectionVariantInputs &
    SliderTickListVariantInputs &
    SliderTickVariantInputs &
    SliderTickLabelListVariantInputs &
    SliderTickLabelVariantInputs &
    SliderHandleVariantInputs;
