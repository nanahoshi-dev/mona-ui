import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const inputVariants = cva(
    `
        flex items-center h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1
        border-input
        placeholder:text-muted-foreground
        selection:bg-primary selection:text-primary-foreground
        text-base shadow-xs
        transition-[color,box-shadow] ease-in-out duration-300
        outline-none
        file:text-foreground
        file:inline-flex file:h-7 file:border-0
        file:bg-transparent file:text-sm
        file:font-medium
        disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
        md:text-sm
        focus-visible:ring-1 focus-visible:ring-ring/90
    `,
    {
        variants: {
            size: {
                default: "h-9",
                small: "h-8 text-sm",
                large: "h-10"
            }
        }
    }
);

export const textAreaVariants = cva(
    `
        rounded-md border bg-transparent px-3 py-1
        border-input
        placeholder:text-muted-foreground
        selection:bg-primary selection:text-primary-foreground
        text-base shadow-xs
        transition-[color,box-shadow] ease-in-out duration-300
        outline-none
        disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
        md:text-sm
        focus-visible:ring-1 focus-visible:ring-ring/90
    `
);

export const textBoxVariants = cva(
    `
        flex items-center w-full min-w-0 rounded-md border bg-transparent px-2 py-1
        border-input
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
        [&>input]:border-0
        [&>input]:bg-transparent
        [&>input]:w-full
        [&>input]:outline-none
    `,
    {
        variants: {
            size: {
                default: "h-9",
                small: "h-8 text-sm",
                large: "h-10"
            }
        }
    }
);

export const textBoxAdornmentVariants = cva(
    `
        flex items-center h-full
        text-muted-foreground
        text-sm
    `,
    {
        variants: {
            position: {
                start: `pr-1`,
                end: "pl-1"
            }
        }
    }
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
export type InputVariantInput = VariantInputs<InputVariantProps>;

export type TextBoxVariantProps = VariantProps<typeof textBoxVariants>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;
