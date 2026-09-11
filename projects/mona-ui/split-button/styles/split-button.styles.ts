import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const splitButtonThemeVariants = cva(
    `
        inline-flex flex-nowrap items-center
        [&>button]:focus-visible:z-10
        [&_svg]:h-5 [&_svg]:w-5
    `,
    {
        variants: {
            look: {
                default: "",
                error: "",
                ghost: "border-transparent",
                info: "",
                outline: "[&>button:not(:last-child)]:border-e [&>button:not(:last-child)]:border-input-border",
                primary: "",
                secondary: "",
                success: "",
                warning: ""
            },
            rounded: {
                full: `
                    rounded-full
                    [&>button]:first:rounded-s-full
                    [&>button]:last:rounded-e-full
                `,
                large: `
                    rounded-lg
                    [&>button]:first:rounded-s-lg
                    [&>button]:last:rounded-e-lg
                `,
                medium: `
                    rounded-md
                    [&>button]:first:rounded-s-md
                    [&>button]:last:rounded-e-md
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-sm
                    [&>button]:first:rounded-s-sm
                    [&>button]:last:rounded-e-sm
                `
            },
            size: {
                large: `
                    [&_svg]:h-5 [&_svg]:w-5
                `,
                medium: `
                    [&_svg]:h-5 [&_svg]:w-5
                `,
                small: `
                    [&_svg]:h-4 [&_svg]:w-4
                `
            }
        },
        defaultVariants: {
            look: "default",
            size: "medium",
            rounded: "medium"
        }
    }
);

export type SplitButtonVariantProps = VariantProps<typeof splitButtonThemeVariants>;

export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
