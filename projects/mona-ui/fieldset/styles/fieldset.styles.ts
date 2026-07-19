import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const fieldsetBaseThemeVariants = cva(
    `
        block
    `
);

export const fieldsetThemeVariants = cva(
    `
        bg-surface text-foreground border border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none bg-disabled-background text-disabled-foreground border-disabled-border",
                false: ""
            }
        },
        defaultVariants: {
            disabled: false
        }
    }
);

export const fieldsetLegendThemeVariants = cva(
    `
        ms-2
    `,
    {
        variants: {
            hasTemplate: {
                true: "",
                false: "px-2 bg-surface-raised text-foreground border border-border-subtle"
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            hasTemplate: false
        }
    }
);

type FieldsetBaseVariantProps = VariantProps<typeof fieldsetBaseThemeVariants>;

type FieldsetBaseVariantInput = VariantInputs<FieldsetBaseVariantProps>;

type FieldsetFieldsetVariantProps = VariantProps<typeof fieldsetThemeVariants>;

type FieldsetFieldsetVariantInput = VariantInputs<FieldsetFieldsetVariantProps>;

type FieldsetLegendVariantProps = VariantProps<typeof fieldsetLegendThemeVariants>;

type FieldsetLegendVariantInput = VariantInputs<FieldsetLegendVariantProps>;

export type FieldsetVariantProps = FieldsetBaseVariantProps & FieldsetFieldsetVariantProps & FieldsetLegendVariantProps;

export type FieldsetVariantInput = FieldsetBaseVariantInput &
    FieldsetFieldsetVariantInput &
    Omit<FieldsetLegendVariantInput, "hasTemplate">;
