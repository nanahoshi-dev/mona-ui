import { cva } from "class-variance-authority";

export const checkboxVariants = cva(`appearance-none outline-none peer hidden`);

export const checkmarkVariants = cva(
    `
        flex items-center justify-center
        w-4.5 h-4.5 pl-0.25
        overflow-hidden outline-none

        bg-input-background border border-input-border
        cursor-pointer

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/40
        focus-within:border-primary

        peer-checked:bg-primary
        peer-checked:text-primary-foreground
        peer-indeterminate:bg-primary

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const checkboxContainerLabelVariants = cva(
    `
        w-full h-full
        inline-flex items-center justify-center gap-2
        relative

        select-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
    `,
    {
        variants: {
            labelSize: {
                large: "text-lg",
                medium: "text-md",
                small: "text-sm"
            }
        }
    }
);

export const checkboxDirectiveVariants = cva(
    `
        appearance-none outline-none
        w-4.5 h-4.5
        bg-input-background border border-input-border
        cursor-pointer
        relative

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50

        checked:text-primary-foreground
        indeterminate:bg-primary
        checked:bg-primary

        focus-visible:ring-2 focus-visible:ring-primary/40
        focus-visible:border-primary

        checked:after:content-['']
        checked:after:absolute
        checked:after:inset-[1px_0_0_1px]
        checked:after:bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%206%209%2017l-5-5'/%3E%3C/svg%3E")]
        checked:after:bg-no-repeat
        checked:after:bg-contain

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);
