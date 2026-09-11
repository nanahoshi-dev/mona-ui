import { themeRaisedBackdropClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import { cva, type VariantProps } from "class-variance-authority";

const roundedTopVariants = {
    small: "rounded-t-sm",
    medium: "rounded-t-md",
    large: "rounded-t-lg",
    xlarge: "rounded-t-xl",
    xxlarge: "rounded-t-2xl",
    none: "rounded-none"
};

const roundedBottomVariants = {
    small: "rounded-b-sm",
    medium: "rounded-b-md",
    large: "rounded-b-lg",
    xlarge: "rounded-b-xl",
    xxlarge: "rounded-b-2xl",
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
