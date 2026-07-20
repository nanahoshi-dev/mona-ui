import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const comboBoxBaseThemeVariants = cva(
    `
        flex items-center
        cursor-pointer
        ${themeControlSurfaceClasses} text-foreground
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
                small: "h-8 text-xs",
                medium: "h-9 text-sm",
                large: "h-10 text-md"
            }
        },
        compoundVariants: [
            {
                focused: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ],
        defaultVariants: {
            disabled: false,
            focused: false,
            invalid: false,
            rounded: "medium",
            size: "medium"
        }
    }
);

export const comboBoxTextInputThemeVariants = cva(
    `
        h-full w-full px-2 text-ellipsis
        bg-transparent border-none shadow-none outline-none
        focus-within:ring-0 focus-within:shadow-none
        focus-visible:ring-0 focus-visible:shadow-none
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full px-3"
            }
        }
    }
);

export const comboBoxAffixContainerThemeVariants = cva(`flex h-full flex-none items-center justify-center`);

type ComboBoxBaseVariantProps = VariantProps<typeof comboBoxBaseThemeVariants>;

type ComboBoxBaseVariantInput = VariantInputs<ComboBoxBaseVariantProps>;

type ComboBoxTextInputVariantProps = VariantProps<typeof comboBoxTextInputThemeVariants>;

type ComboBoxTextInputVariantInput = VariantInputs<ComboBoxTextInputVariantProps>;

type ComboBoxAffixContainerVariantProps = VariantProps<typeof comboBoxAffixContainerThemeVariants>;

type ComboBoxAffixContainerVariantInput = VariantInputs<ComboBoxAffixContainerVariantProps>;

export type ComboBoxVariantProps = ComboBoxBaseVariantProps &
    ComboBoxTextInputVariantProps &
    ComboBoxAffixContainerVariantProps;

export type ComboBoxVariantInput = Omit<ComboBoxBaseVariantInput, "focused" | "invalid"> &
    ComboBoxTextInputVariantInput &
    ComboBoxAffixContainerVariantInput;
