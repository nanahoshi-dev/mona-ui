import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

export const filterMenuBaseThemeVariants = cva(
    `
        flex w-full flex-col
        gap-2 p-1
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay)
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            },
            size: {
                small: "",
                medium: "",
                large: ""
            }
        }
    }
);

export const filterMenuItemThemeVariants = cva(
    `
        flex flex-col gap-1
        [&>mona-button-group>button]:flex-1
    `
);

export const filterMenuActionsThemeVariants = cva(
    `
        flex flex-row
        items-center justify-center
        gap-1 [&>button]:flex-1
    `
);

type FilterMenuBaseVariantProps = VariantProps<typeof filterMenuBaseThemeVariants>;

type FilterMenuBaseVariantInput = VariantInputs<FilterMenuBaseVariantProps>;

export type FilterMenuVariantProps = FilterMenuBaseVariantProps;

export type FilterMenuVariantInput = FilterMenuBaseVariantInput;
