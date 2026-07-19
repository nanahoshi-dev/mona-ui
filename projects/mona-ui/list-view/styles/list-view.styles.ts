import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const listViewBaseThemeVariants = cva(
    `
        flex h-full flex-col overflow-hidden
        bg-surface text-foreground
        border border-border
        outline-none
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "text-sm",
                medium: "text-base",
                large: "text-lg"
            }
        }
    }
);

type ListViewBaseVariantProps = VariantProps<typeof listViewBaseThemeVariants>;

type ListViewBaseVariantInputs = VariantInputs<ListViewBaseVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps;

export type ListViewVariantInputs = ListViewBaseVariantInputs;
