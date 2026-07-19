import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const multiSelectBaseThemeVariants = cva(
    `
        flex items-center justify-between
        cursor-pointer
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control) outline-none
        transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out
        data-[readonly='true']:cursor-default
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
    `,
    {
        variants: {
            disabled: {
                true: `
                    pointer-events-none cursor-not-allowed
                    bg-disabled-background text-disabled-foreground
                    border-disabled-border shadow-none
                `
            },
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35 focus-within:border-error focus-within:ring-error/35",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                small: "min-h-8 text-xs",
                medium: "min-h-9 text-sm",
                large: "min-h-10 text-md"
            }
        },
        compoundVariants: [
            {
                focused: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ]
    }
);

export const multiSelectItemContainerThemeVariants = cva(
    `
        flex flex-1 flex-wrap items-center gap-1 p-1
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const multiSelectAffixContainerThemeVariants = cva(`flex h-full flex-none items-center justify-center`);

export const multiSelectIndicatorContainerThemeVariants = cva(`self-center`, {
    variants: {
        size: {
            small: "h-8",
            medium: "h-9",
            large: "h-10"
        }
    }
});

type MultiSelectBaseVariantProps = VariantProps<typeof multiSelectBaseThemeVariants>;

type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;

type MultiSelectItemContainerVariantProps = VariantProps<typeof multiSelectItemContainerThemeVariants>;

type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;

type MultiSelectAffixContainerVariantProps = VariantProps<typeof multiSelectAffixContainerThemeVariants>;

type MultiSelectAffixContainerVariantInput = VariantInputs<MultiSelectAffixContainerVariantProps>;

type MultiSelectIndicatorContainerVariantProps = VariantProps<typeof multiSelectIndicatorContainerThemeVariants>;

type MultiSelectIndicatorContainerVariantInput = VariantInputs<MultiSelectIndicatorContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps &
    MultiSelectItemContainerVariantProps &
    MultiSelectAffixContainerVariantProps &
    MultiSelectIndicatorContainerVariantProps;

export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused" | "invalid"> &
    MultiSelectItemContainerVariantInput &
    MultiSelectAffixContainerVariantInput &
    MultiSelectIndicatorContainerVariantInput;
