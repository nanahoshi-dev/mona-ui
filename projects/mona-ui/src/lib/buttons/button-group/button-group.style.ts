import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const buttonGroupVariants = cva(
    `
        inline-flex items-center justify-center rounded-md shadow border border-input
        [&>button]:border-0
        [&>button.mona-selected]:bg-accent [&>button.mona-selected]:text-accent-foreground
        [&>button]:w-full [&>button]:h-full [&>button]:rounded-none [&>button]:shadow-none
        [&>button]:first:rounded-tl-md [&>button]:first:rounded-bl-md
        [&>button]:last:rounded-tr-md [&>button]:last:rounded-br-md
    `,
    {
        variants: {
            look: {
                default: "shadow-none border-none bg-transparent",
                outline: "[&>button:not(:last-child)]:border-r"
            },
            size: {
                default: "h-9 [&>button]:px-4 [&>button]:py-2",
                small: `h-8 [&>button]:px-3 text-xs`,
                large: `h-10 rounded-md [&>button]:px-8`,
                icon: "h-9 [&>button]:flex-1"
            }
        },
        defaultVariants: {
            look: "default",
            size: "default"
        }
    }
);

export type ButtonGroupVariantProps = VariantProps<typeof buttonGroupVariants>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
