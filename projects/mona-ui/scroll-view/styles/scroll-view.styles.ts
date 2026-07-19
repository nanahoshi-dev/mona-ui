import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const scrollViewBaseThemeVariants = cva(
    `
        relative block h-full w-full overflow-hidden
        bg-surface outline-none
        border border-border-subtle
        focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
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
    `
);

export const scrollViewListThemeVariants = cva(
    `
        relative h-full list-none
        [&_li]:absolute
        [&_li]:inset-0
        [&_li]:outline-none
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
        [&_svg]:stroke-current
    `,
    {
        variants: {
            hidden: {
                true: "hidden",
                false: ""
            },
            left: {
                true: "left-0",
                false: ""
            },
            right: {
                true: "right-0",
                false: ""
            }
        }
    }
);

export const scrollViewPagerThemeVariants = cva(
    `
        absolute right-0 bottom-0 left-0 flex items-center justify-center
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
        bg-muted-foreground/40 border border-border-subtle
        transition-colors
        not-last:me-3
        hover:bg-muted-foreground/60 active:bg-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            active: {
                true: "!bg-foreground hover:!bg-foreground",
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
        [&_svg]:stroke-current
    `
);

type ScrollViewBaseVariantProps = VariantProps<typeof scrollViewBaseThemeVariants>;

type ScrollViewBaseVariantInput = VariantInputs<ScrollViewBaseVariantProps>;

type ScrollViewContentVariantProps = VariantProps<typeof scrollViewContentThemeVariants>;

type ScrollViewContentVariantInput = VariantInputs<ScrollViewContentVariantProps>;

type ScrollViewListVariantProps = VariantProps<typeof scrollViewListThemeVariants>;

type ScrollViewListVariantInput = VariantInputs<ScrollViewListVariantProps>;

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
    ScrollViewListVariantProps &
    ScrollViewArrowVariantProps &
    ScrollViewPagerVariantProps &
    ScrollViewPagerListContainerVariantProps &
    ScrollViewPagerListVariantProps &
    ScrollViewPagerListItemVariantProps &
    ScrollViewPagerArrowVariantProps;

export type ScrollViewVariantInput = ScrollViewBaseVariantInput &
    ScrollViewContentVariantInput &
    ScrollViewListVariantInput &
    Omit<ScrollViewArrowVariantInput, "hidden" | "left" | "right"> &
    ScrollViewPagerVariantInput &
    ScrollViewPagerListContainerVariantInput &
    ScrollViewPagerListVariantInput &
    Omit<ScrollViewPagerListItemVariantInput, "active"> &
    ScrollViewPagerArrowVariantInput;
