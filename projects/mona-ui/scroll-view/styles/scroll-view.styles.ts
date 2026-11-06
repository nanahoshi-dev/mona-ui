import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const scrollViewBaseThemeVariants = cva(
    `
        relative block h-full w-full overflow-hidden
        bg-surface
        border border-border-subtle
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const scrollViewContentThemeVariants = cva(
    `
        absolute inset-0 overflow-hidden
        touch-pan-y touch-pinch-zoom
    `
);

export const scrollViewSlideThemeVariants = cva(
    `
        absolute inset-0
    `
);

export const scrollViewArrowThemeVariants = cva(
    `
        absolute top-0 bottom-0 flex items-center justify-center
        px-1
        cursor-pointer select-none
        bg-surface-overlay/65 text-foreground
        transition-colors duration-(--mona-motion-standard) ease-out
        hover:bg-hover/90 active:bg-active/90
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
        [&_svg]:stroke-current
    `,
    {
        variants: {
            hidden: {
                true: "hidden",
                false: ""
            },
            side: {
                left: "left-0",
                right: "right-0"
            }
        }
    }
);

export const scrollViewPagerThemeVariants = cva(
    `
        absolute inset-x-0 bottom-0 flex items-center justify-center
    `,
    {
        variants: {
            pagerOverlay: {
                dark: "bg-canvas/85 border-0 border-t border-border-subtle",
                light: "bg-surface-overlay/85 border-0 border-t border-border-subtle",
                none: ""
            }
        }
    }
);

export const scrollViewPagerListContainerThemeVariants = cva(
    `
        flex flex-1 items-center justify-center overflow-hidden
    `
);

export const scrollViewPagerListThemeVariants = cva(
    `
        flex flex-nowrap items-center gap-2
        overflow-hidden list-none
        px-1 py-3
    `
);

export const scrollViewPagerListItemThemeVariants = cva(
    `
        h-3 w-3 flex-none basis-3
        cursor-pointer
        bg-transparent border border-muted-foreground
        transition-colors
        not-last:me-3
        hover:bg-muted-foreground/60 active:bg-foreground
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            active: {
                true: "!bg-foreground hover:!bg-foreground !border-foreground forced-color-adjust-none forced-colors:!bg-[CanvasText] forced-colors:!border-[CanvasText]",
                false: ""
            },
            pagerRounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

export const scrollViewPagerArrowThemeVariants = cva(
    `
        flex items-center justify-center
        p-2
        cursor-pointer select-none
        font-medium text-muted-foreground
        transition-colors duration-(--mona-motion-standard) ease-out
        hover:bg-hover hover:text-foreground active:bg-active
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
        [&_svg]:stroke-current
    `
);

type ScrollViewBaseVariantProps = VariantProps<typeof scrollViewBaseThemeVariants>;

type ScrollViewBaseVariantInput = VariantInputs<ScrollViewBaseVariantProps>;

type ScrollViewContentVariantProps = VariantProps<typeof scrollViewContentThemeVariants>;

type ScrollViewContentVariantInput = VariantInputs<ScrollViewContentVariantProps>;

type ScrollViewPagerVariantProps = VariantProps<typeof scrollViewPagerThemeVariants>;

type ScrollViewPagerVariantInput = VariantInputs<ScrollViewPagerVariantProps>;

type ScrollViewPagerListContainerVariantProps = VariantProps<typeof scrollViewPagerListContainerThemeVariants>;

type ScrollViewPagerListContainerVariantInput = VariantInputs<ScrollViewPagerListContainerVariantProps>;

type ScrollViewPagerListVariantProps = VariantProps<typeof scrollViewPagerListThemeVariants>;

type ScrollViewPagerListVariantInput = VariantInputs<ScrollViewPagerListVariantProps>;

type ScrollViewPagerListItemVariantProps = VariantProps<typeof scrollViewPagerListItemThemeVariants>;

type ScrollViewPagerListItemVariantInput = VariantInputs<ScrollViewPagerListItemVariantProps>;

type ScrollViewArrowVariantProps = VariantProps<typeof scrollViewArrowThemeVariants>;

type ScrollViewArrowVariantInput = VariantInputs<ScrollViewArrowVariantProps>;

type ScrollViewPagerArrowVariantProps = VariantProps<typeof scrollViewPagerArrowThemeVariants>;

type ScrollViewPagerArrowVariantInput = VariantInputs<ScrollViewPagerArrowVariantProps>;

export type ScrollViewVariantProps = ScrollViewBaseVariantProps &
    ScrollViewContentVariantProps &
    ScrollViewArrowVariantProps &
    ScrollViewPagerVariantProps &
    ScrollViewPagerListContainerVariantProps &
    ScrollViewPagerListVariantProps &
    ScrollViewPagerListItemVariantProps &
    ScrollViewPagerArrowVariantProps;

export type ScrollViewVariantInput = ScrollViewBaseVariantInput &
    ScrollViewContentVariantInput &
    Omit<ScrollViewArrowVariantInput, "hidden" | "side"> &
    ScrollViewPagerVariantInput &
    ScrollViewPagerListContainerVariantInput &
    ScrollViewPagerListVariantInput &
    Omit<ScrollViewPagerListItemVariantInput, "active"> &
    ScrollViewPagerArrowVariantInput;
