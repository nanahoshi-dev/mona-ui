import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const breadcrumbListThemeVariants = cva(
    `
        flex list-none items-center gap-1 overflow-hidden px-2 py-1
        select-none
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

export const breadcrumbListItemThemeVariants = cva(
    `
        flex h-full items-center truncate px-1
        cursor-pointer
        text-muted-foreground
        bg-transparent border-0 rounded-sm outline-none
        transition-colors duration-100 ease-in-out
        hover:bg-hover hover:text-foreground
        active:bg-active active:text-foreground
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground",
                false: ""
            },
            listDisabled: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [{ disabled: true, listDisabled: false, class: "text-disabled-foreground" }],
        defaultVariants: {
            disabled: false,
            listDisabled: false
        }
    }
);

export const breadcrumbCurrentItemThemeVariants = cva(
    `flex cursor-default items-center truncate font-medium text-foreground`
);

type BreadcrumbListVariantProps = VariantProps<typeof breadcrumbListThemeVariants>;

type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbListItemVariantProps = VariantProps<typeof breadcrumbListItemThemeVariants>;

export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps & BreadcrumbListItemVariantProps;

export type BreadcrumbVariantInput = BreadcrumbListVariantInput & Omit<BreadcrumbListItemVariantInput, "listDisabled">;
