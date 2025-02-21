import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const dropdownSelectorVariants = cva(
    `
        inline-flex items-center whitespace-nowrap cursor-pointer rounded-md text-sm
        border border-input bg-background shadow-sm
        data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50
        hover:bg-accent hover:text-accent-foreground
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/10
        focus-visible:shadow cursor-pointer
        px-3
    `,
    {
        variants: {
            size: {
                default: "h-9",
                small: "h-8",
                large: "h-10"
            }
        },
        defaultVariants: {
            size: "default"
        }
    }
);

export const dropdownPopupVariants = cva(
    `
        bg-background shadow-lg border border-border rounded-md text-sm
        h-full max-h-64 overflow-auto
    `,
    {
        variants: {}
    }
);
export type DropdownSelectorVariantProps = VariantProps<typeof dropdownSelectorVariants>;
export type DropdownSelectorVariantInput = VariantInputs<DropdownSelectorVariantProps>;
