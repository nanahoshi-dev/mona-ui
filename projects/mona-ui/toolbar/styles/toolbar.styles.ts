import { cva, type VariantProps } from "class-variance-authority";

/** Children keep their width, so what doesn't fit overflows and can be measured, instead of squeezing. */
export const toolbarThemeVariants = cva("flex w-full min-w-0 items-center [&>*]:shrink-0", {
    variants: {
        overflow: {
            menu: "flex-nowrap",
            wrap: "flex-wrap"
        },
        size: {
            small: "gap-0.5",
            medium: "gap-1",
            large: "gap-1.5"
        }
    },
    defaultVariants: {
        overflow: "menu",
        size: "medium"
    }
});

export type ToolbarVariantProps = VariantProps<typeof toolbarThemeVariants>;
