import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const ratingContainerThemeVariants = cva(`inline-flex items-center gap-2.5`);

export const ratingControlThemeVariants = cva(
    `
        group
        inline-flex items-center
        cursor-pointer select-none
        rounded-md
        outline-none
        transition-colors duration-(--mona-motion-fast)
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
        data-[disabled="true"]:pointer-events-none
        data-[disabled="true"]:cursor-not-allowed
        data-[readonly="true"]:cursor-default
        data-[invalid="true"]:ring-2 data-[invalid="true"]:ring-error/35
        data-[invalid="true"]:focus-visible:ring-error/35
    `,
    {
        variants: {
            size: {
                small: "gap-1 p-0.5",
                medium: "gap-1 p-1",
                large: "gap-1.5 p-1.5"
            }
        },
        defaultVariants: {
            size: "medium"
        }
    }
);

export const ratingItemThemeVariants = cva(`relative flex items-center justify-center overflow-hidden`, {
    variants: {
        size: {
            small: "h-6 w-6",
            medium: "h-7 w-7",
            large: "h-8 w-8"
        }
    },
    defaultVariants: {
        size: "medium"
    }
});

export const ratingIconThemeVariants = cva(
    `
        block shrink-0
        text-muted-foreground opacity-45
        transition-colors duration-(--mona-motion-fast)
        group-data-[disabled="true"]:text-disabled-foreground
    `,
    {
        variants: {
            size: {
                small: "h-4 w-4",
                medium: "h-5 w-5",
                large: "h-6 w-6"
            }
        },
        defaultVariants: {
            size: "medium"
        }
    }
);

export const ratingOverlayClipThemeVariants = cva(`
    absolute bottom-0 start-0 top-0
    pointer-events-none
    overflow-hidden
`);

export const ratingOverlayContentThemeVariants = cva(
    `
        flex items-center justify-start
        fill-current
        text-warning
        transition-colors duration-(--mona-motion-fast)
        group-data-[disabled="true"]:text-disabled-foreground
        data-[state="hovered"]:text-warning-hover
    `,
    {
        variants: {
            size: {
                small: "h-6 w-6",
                medium: "h-7 w-7",
                large: "h-8 w-8"
            }
        },
        defaultVariants: {
            size: "medium"
        }
    }
);

export const ratingLabelThemeVariants = cva(`whitespace-nowrap`, {
    variants: {
        size: {
            small: "text-sm",
            medium: "text-sm",
            large: "text-base"
        }
    },
    defaultVariants: {
        size: "medium"
    }
});

export type RatingContainerVariantProps = VariantProps<typeof ratingContainerThemeVariants>;

export type RatingContainerVariantInput = VariantInputs<RatingContainerVariantProps>;

export type RatingControlVariantProps = VariantProps<typeof ratingControlThemeVariants>;

export type RatingControlVariantInput = VariantInputs<RatingControlVariantProps>;

export type RatingItemVariantProps = VariantProps<typeof ratingItemThemeVariants>;

export type RatingItemVariantInput = VariantInputs<RatingItemVariantProps>;

export type RatingIconVariantProps = VariantProps<typeof ratingIconThemeVariants>;

export type RatingIconVariantInput = VariantInputs<RatingIconVariantProps>;

export type RatingOverlayClipVariantProps = VariantProps<typeof ratingOverlayClipThemeVariants>;

export type RatingOverlayClipVariantInput = VariantInputs<RatingOverlayClipVariantProps>;

export type RatingOverlayContentVariantProps = VariantProps<typeof ratingOverlayContentThemeVariants>;

export type RatingOverlayContentVariantInput = VariantInputs<RatingOverlayContentVariantProps>;

export type RatingLabelVariantProps = VariantProps<typeof ratingLabelThemeVariants>;

export type RatingLabelVariantInput = VariantInputs<RatingLabelVariantProps>;

export type RatingVariantProps = RatingContainerVariantProps &
    RatingControlVariantProps &
    RatingItemVariantProps &
    RatingIconVariantProps &
    RatingOverlayClipVariantProps &
    RatingOverlayContentVariantProps &
    RatingLabelVariantProps;

export type RatingVariantInput = RatingContainerVariantInput &
    RatingControlVariantInput &
    RatingItemVariantInput &
    RatingIconVariantInput &
    RatingOverlayClipVariantInput &
    RatingOverlayContentVariantInput &
    RatingLabelVariantInput;
