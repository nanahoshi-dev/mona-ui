import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const breadcrumbListThemeVariants = cva(
    `
        flex list-none items-center gap-1 overflow-hidden px-2 py-1
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground",
                false: ""
            }
        }
    }
);

/**
 * `min-w-0`, or a flex item never gets narrower than its text, and nothing inside it ever truncates. The other items
 * shrink faster than the current page, so it's the one that stays readable. The current page keeps a factor of 1 rather
 * than a fraction, because flexbox only takes that fraction of the overflow once it's the last item left to shrink.
 */
export const breadcrumbListItemWrapperThemeVariants = cva(`flex min-w-0 items-center`, {
    variants: {
        current: {
            true: "",
            false: "shrink-[10]"
        }
    }
});

/** Inset focus, because the list clips anything outside it. */
export const breadcrumbListItemThemeVariants = cva(
    `
        flex h-full max-w-full min-w-0 items-center px-1
        cursor-pointer
        bg-transparent border-0 rounded-sm
        transition-colors duration-100 ease-in-out
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground",
                false: "text-muted-foreground hover:bg-hover hover:text-foreground active:bg-active active:text-foreground"
            }
        },
        defaultVariants: {
            disabled: false
        }
    }
);

/** Text in a flex item only truncates from a block of its own, and an icon beside it has to stay on the same line. */
export const breadcrumbItemContentThemeVariants = cva(`min-w-0 truncate [&_svg]:inline`);

export const breadcrumbLinkThemeVariants = cva(
    `
        block max-w-full min-w-0 truncate rounded-sm px-1 [&_svg]:inline
        transition-colors duration-100 ease-in-out
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            current: {
                true: "font-medium text-foreground",
                false: ""
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground",
                false: ""
            }
        },
        compoundVariants: [
            {
                current: false,
                disabled: false,
                class: "text-muted-foreground hover:bg-hover hover:text-foreground active:bg-active active:text-foreground"
            }
        ],
        defaultVariants: {
            current: false,
            disabled: false
        }
    }
);

export const breadcrumbCurrentItemThemeVariants = cva(
    `block min-w-0 cursor-default truncate font-medium text-foreground [&_svg]:inline`
);

type BreadcrumbListVariantProps = VariantProps<typeof breadcrumbListThemeVariants>;

type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbListItemVariantProps = VariantProps<typeof breadcrumbListItemThemeVariants>;

export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps & BreadcrumbListItemVariantProps;

export type BreadcrumbVariantInput = BreadcrumbListVariantInput & BreadcrumbListItemVariantInput;
