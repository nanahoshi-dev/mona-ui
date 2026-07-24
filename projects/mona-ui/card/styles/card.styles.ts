import { themeRaisedBackdropClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import { cva, type VariantProps } from "class-variance-authority";

const roundedTopVariants = {
    small: "rounded-tl-sm rounded-tr-sm",
    medium: "rounded-tl-md rounded-tr-md",
    large: "rounded-tl-lg rounded-tr-lg",
    xlarge: "rounded-tl-xl rounded-tr-xl",
    xxlarge: "rounded-tl-2xl rounded-tr-2xl",
    none: "rounded-none"
};

const roundedBottomVariants = {
    small: "rounded-bl-sm rounded-br-sm",
    medium: "rounded-bl-md rounded-br-md",
    large: "rounded-bl-lg rounded-br-lg",
    xlarge: "rounded-bl-xl rounded-br-xl",
    xxlarge: "rounded-bl-2xl rounded-br-2xl",
    none: "rounded-none"
};

const roundedAllVariants = {
    small: "rounded-sm",
    medium: "rounded-md",
    large: "rounded-lg",
    xlarge: "rounded-xl",
    xxlarge: "rounded-2xl",
    none: "rounded-none"
};

export const cardBaseThemeVariants = cva(
    `
        flex flex-col gap-2 py-4
        ${themeRaisedBackdropClasses}
        border border-border
        bg-(--color-card) text-(--color-card-foreground)
        shadow-(--shadow-raised)
    `,
    {
        variants: {
            rounded: roundedAllVariants,
            hasFooter: {
                true: "pb-0",
                false: ""
            },
            hasHeader: {
                true: "pt-0",
                false: ""
            }
        }
    }
);

export const cardFooterThemeVariants = cva(
    `
        flex flex-row
        justify-between
        items-center
        p-4
        border-t
        border-border
    `,
    {
        variants: {
            rounded: roundedBottomVariants
        }
    }
);

export const cardHeaderThemeVariants = cva(
    `
        grid grid-cols-[1fr_auto] grid-rows-2
        p-4 pb-0
    `,
    {
        variants: {
            rounded: roundedTopVariants
        }
    }
);

export const cardHeaderTitleThemeVariants = cva(`col-start-1 row-start-1 items-center`);

export const cardHeaderDescriptionThemeVariants = cva(`col-start-1 row-start-2`);

export const cardHeaderActionsThemeVariants = cva(`col-start-2 row-start-1 row-span-2 self-start justify-self-end`);

type CardBaseVariantProps = VariantProps<typeof cardBaseThemeVariants>;
type CardBaseVariantInput = VariantInputs<CardBaseVariantProps>;

export type CardVariantProps = CardBaseVariantProps;
export type CardVariantInput = Omit<CardBaseVariantInput, "hasFooter" | "hasHeader">;
