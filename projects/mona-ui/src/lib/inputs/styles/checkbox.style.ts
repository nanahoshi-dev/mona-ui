import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "../../utils/VariantInputs";

export const checkboxVariants = cva(
    `
        appearance-none place-content-center cursor-pointer
        outline-none peer hidden
    `
);

export const checkMarkVariants = cva(
    `
        w-5 h-5
        flex items-center justify-center
        pl-0.5 overflow-hidden
        border border-input shadow
        rounded-md text-sm
        cursor-pointer
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed data-[disabled='true']:opacity-50
        peer-checked:bg-primary peer-checked:text-primary-foreground
        peer-indeterminate:bg-primary
    `
);

export const checkboxContainerLabelVariants = cva(
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

export type CheckBoxContainerLabelVariantProps = VariantProps<typeof checkboxContainerLabelVariants>;
export type CheckBoxContainerLabelVariantInput = VariantInputs<CheckBoxContainerLabelVariantProps>;
