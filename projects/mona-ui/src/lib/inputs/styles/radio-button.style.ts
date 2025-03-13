import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "../../utils/VariantInputs";

export const radioButtonVariants = cva(
    `
        appearance-none outline-none
        peer hidden
    `
);

export const radioButtonCircleVariants = cva(
    `
        w-4.5 h-4.5
        flex items-center justify-center
        overflow-hidden
        border border-primary
        rounded-full
        cursor-pointer
    `
);

export const radioButtonIndicatorVariants = cva(
    `
        flex w-3 h-3 bg-primary rounded-full
    `
);

export const radioButtonContainerLabelVariants = cva(
    `
        w-full h-full flex items-center justify-center gap-1
        relative
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
    `,
    {
        variants: {
            labelSize: {
                default: "text-base",
                small: "text-sm",
                large: "text-lg"
            }
        },
        defaultVariants: {
            labelSize: "default"
        }
    }
);

export type RadioButtonContainerLabelVariantProps = VariantProps<typeof radioButtonContainerLabelVariants>;
export type RadioButtonContainerLabelVariantInput = VariantInputs<RadioButtonContainerLabelVariantProps>;
