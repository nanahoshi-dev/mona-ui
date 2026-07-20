import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const listBoxBaseThemeVariants = cva(
    `
        flex gap-1
        [&_mona-list-view]:w-full
    `,
    {
        variants: {
            direction: {
                horizontal: "flex-row",
                vertical: "flex-col"
            },
            reversed: {
                true: "",
                false: ""
            },
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
        },
        compoundVariants: [
            {
                direction: "horizontal",
                reversed: true,
                class: "flex-row-reverse"
            },
            {
                direction: "vertical",
                reversed: true,
                class: "flex-col-reverse"
            }
        ]
    }
);

export const listBoxToolbarThemeVariants = cva(
    `
        flex gap-1
        items-center justify-center
    `,
    {
        variants: {
            direction: {
                horizontal: "flex-row",
                vertical: "flex-col"
            }
        }
    }
);

type ListBoxBaseVariantProps = VariantProps<typeof listBoxBaseThemeVariants>;

type ListBoxBaseVariantInputs = Omit<VariantInputs<ListBoxBaseVariantProps>, "direction" | "reversed">;

type ListBoxToolbarVariantProps = VariantProps<typeof listBoxToolbarThemeVariants>;

type ListBoxToolbarVariantInputs = Omit<VariantInputs<ListBoxToolbarVariantProps>, "direction">;

export type ListBoxVariantProps = ListBoxBaseVariantProps & ListBoxToolbarVariantProps;

export type ListBoxVariantInputs = ListBoxBaseVariantInputs & ListBoxToolbarVariantInputs;
