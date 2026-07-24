import { themeRaisedBackdropClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import { cva, type VariantProps } from "class-variance-authority";

export const cardBaseThemeVariants = cva(
    `
        flex flex-col
        ${themeRaisedBackdropClasses}
        border border-border
        bg-gray-50 shadow-md
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

export const cardFooterThemeVariants = cva(
    `
        flex flex-row
        justify-between
        items-center
        p-2
        bg-gray-100
        border-t
        border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-bl-sm rounded-br-sm",
                medium: "rounded-bl-md rounded-br-md",
                large: "rounded-bl-lg rounded-br-lg",
                none: "rounded-none"
            }
        }
    }
);

export const cardHeaderThemeVariants = cva(
    `
        grid grid-cols-[1fr_auto] grid-rows-2
        p-2
        border-b
        border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-tl-sm rounded-tr-sm",
                medium: "rounded-tl-md rounded-tr-md",
                large: "rounded-tl-lg rounded-tr-lg",
                none: "rounded-none"
            }
        }
    }
);

type CardBaseVariantProps = VariantProps<typeof cardBaseThemeVariants>;
type CardBaseVariantInput = VariantInputs<CardBaseVariantProps>;

export type CardVariantProps = CardBaseVariantProps;
export type CardVariantInput = CardBaseVariantInput;
