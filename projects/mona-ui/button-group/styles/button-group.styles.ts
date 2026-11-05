import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const buttonGroupThemeVariants = cva(
    `
        inline-flex items-center justify-center
        border border-input-border
        [&>button]:border-0
        [&>button]:shadow-none
        [&>*:not(:last-child)]:border-e
        [&>*:not(:last-child)]:border-border-subtle
        [&>button]:rounded-none
        [&>button]:focus-visible:z-10
        [&>*>button]:border-0
        [&>*>button]:shadow-none
        [&>*>button]:rounded-none!
        [&>*>button]:focus-visible:z-10
        [&>*>button:not(:last-of-type)]:border-e
        [&>*>button:not(:last-of-type)]:border-border-subtle
    `,
    {
        variants: {
            look: {
                default: "",
                error: "border-transparent",
                ghost: "border-transparent [&>*:not(:last-child)]:border-e-0 [&>*>button:not(:last-of-type)]:border-e-0",
                info: "border-transparent",
                outline: "",
                primary: "border-transparent",
                secondary: "border-transparent",
                success: "border-transparent",
                warning: "border-transparent"
            },
            rounded: {
                full: `
                    rounded-full
                    [&>button]:first:rounded-ss-full [&>button]:first:rounded-es-full
                    [&>button]:last:rounded-se-full [&>button]:last:rounded-ee-full
                    [&>*:first-child>button:first-of-type]:rounded-ss-full! [&>*:first-child>button:first-of-type]:rounded-es-full!
                    [&>*:last-child>button:last-of-type]:rounded-se-full! [&>*:last-child>button:last-of-type]:rounded-ee-full!
                `,
                large: `
                    rounded-lg
                    [&>button]:first:rounded-ss-lg [&>button]:first:rounded-es-lg
                    [&>button]:last:rounded-se-lg [&>button]:last:rounded-ee-lg
                    [&>*:first-child>button:first-of-type]:rounded-ss-lg! [&>*:first-child>button:first-of-type]:rounded-es-lg!
                    [&>*:last-child>button:last-of-type]:rounded-se-lg! [&>*:last-child>button:last-of-type]:rounded-ee-lg!
                `,
                medium: `
                    rounded-md
                    [&>button]:first:rounded-ss-md [&>button]:first:rounded-es-md
                    [&>button]:last:rounded-se-md [&>button]:last:rounded-ee-md
                    [&>*:first-child>button:first-of-type]:rounded-ss-md! [&>*:first-child>button:first-of-type]:rounded-es-md!
                    [&>*:last-child>button:last-of-type]:rounded-se-md! [&>*:last-child>button:last-of-type]:rounded-ee-md!
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-sm
                    [&>button]:first:rounded-ss-sm [&>button]:first:rounded-es-sm
                    [&>button]:last:rounded-se-sm [&>button]:last:rounded-ee-sm
                    [&>*:first-child>button:first-of-type]:rounded-ss-sm! [&>*:first-child>button:first-of-type]:rounded-es-sm!
                    [&>*:last-child>button:last-of-type]:rounded-se-sm! [&>*:last-child>button:last-of-type]:rounded-ee-sm!
                `
            },
            size: {
                large: ``,
                medium: "",
                small: ``
            }
        },
        defaultVariants: {
            look: "default",
            size: "medium"
        }
    }
);

export type ButtonGroupVariantProps = VariantProps<typeof buttonGroupThemeVariants>;

export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
