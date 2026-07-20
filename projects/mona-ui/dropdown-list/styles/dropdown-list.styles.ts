import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const dropdownListInputThemeVariants = cva(
    `
        inline-flex items-center
        cursor-pointer select-none
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control) outline-none
        transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out
        data-[readonly='true']:cursor-default
        hover:bg-hover active:bg-active
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
    `,
    {
        variants: {
            disabled: {
                true: `
                    pointer-events-none cursor-not-allowed
                    bg-disabled-background text-disabled-foreground
                    border-disabled-border shadow-none
                `,
                false: ""
            },
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
                false: ""
            },
            hasPrefix: {
                false: "ps-2"
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
                full: "rounded-full px-3"
            },
            size: {
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        },
        compoundVariants: [
            {
                expanded: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ]
    }
);

export const dropdownListValueContainerThemeVariants = cva(`flex h-full w-full items-center overflow-hidden`, {
    variants: {
        hasTemplate: {
            false: "[&>span]:truncate [&>span]:items-center [&>span]:inline-block"
        }
    }
});

export const dropdownListAffixContainerThemeVariants = cva(`flex h-full flex-none items-center justify-center`);

type DropdownListInputVariantProps = VariantProps<typeof dropdownListInputThemeVariants>;

type DropdownListInputVariantInput = VariantInputs<DropdownListInputVariantProps>;

type DropdownListAffixContainerVariantProps = VariantProps<typeof dropdownListAffixContainerThemeVariants>;

type DropdownListAffixContainerVariantInput = VariantInputs<DropdownListAffixContainerVariantProps>;

type DropdownListValueContainerVariantProps = VariantProps<typeof dropdownListValueContainerThemeVariants>;

type DropdownListValueContainerVariantInput = VariantInputs<DropdownListValueContainerVariantProps>;

export type DropDownListVariantProps = DropdownListInputVariantProps &
    DropdownListAffixContainerVariantProps &
    DropdownListValueContainerVariantProps;

export type DropDownListVariantInput = Omit<DropdownListInputVariantInput, "expanded" | "hasPrefix" | "invalid"> &
    DropdownListAffixContainerVariantInput &
    Omit<DropdownListValueContainerVariantInput, "hasTemplate">;
