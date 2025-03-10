import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "../../utils/VariantInputs";

export const numericTextboxVariants = cva(
    `
        flex items-center w-full min-w-0 rounded-md border bg-transparent
        border-input p-0
        placeholder:text-muted-foreground
        selection:bg-primary selection:text-primary-foreground
        text-base shadow-xs
        transition-[color,box-shadow] ease-in-out duration-300
        outline-none
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        md:text-sm
        focus-within:ring-1 focus-within:ring-ring/90
    `,
    {
        variants: {
            size: {
                default: "h-9",
                small: "h-8 text-sm",
                large: "h-10"
            }
        },
        defaultVariants: {
            size: "default"
        }
    }
);

export const numericTextBoxInputVariants = cva(
    `
        border-0 outline-none ring-0
        focus-visible:ring-0 shadow-none
    `
);

export const numericTextBoxSpinButtonVariants = cva(
    `
        flex-1 flex items-center p-0
    `,
    {
        variants: {
            position: {
                top: "rounded-tl-none rounded-bl-none rounded-br-none",
                bottom: "rounded-tl-none rounded-bl-none rounded-tr-none"
            }
        }
    }
);

export type NumericTextBoxVariantProps = VariantProps<typeof numericTextboxVariants>;
export type NumericTextBoxVariantInput = VariantInputs<NumericTextBoxVariantProps>;
