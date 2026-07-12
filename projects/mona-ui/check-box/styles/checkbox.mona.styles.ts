import { cva } from "class-variance-authority";

export const checkboxVariants = cva(`sr-only appearance-none outline-none peer`);

export const checkmarkVariants = cva(
    `
        flex items-center justify-center
        w-4.5 h-4.5 pl-0.25
        overflow-hidden outline-none

        bg-input-background border border-input-border
        cursor-pointer
        transition-[background-color,border-color,box-shadow,color] ease-in-out duration-150 motion-reduce:transition-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        peer-focus-visible:border-focus-indicator peer-focus-visible:ring-2 peer-focus-visible:ring-focus-indicator/35

        peer-checked:bg-primary
        peer-checked:text-primary-foreground

        peer-indeterminate:bg-primary
        peer-indeterminate:text-primary-foreground
        peer-indeterminate:after:content-['']
        peer-indeterminate:after:absolute
        peer-indeterminate:after:inset-[3px_0_3px_0]
        peer-indeterminate:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M5%2012h14'%2F%3E%3C%2Fsvg%3E")]
        peer-indeterminate:after:[mask-repeat:no-repeat]
        peer-indeterminate:after:[mask-size:contain]
        peer-indeterminate:after:bg-current

        [&.ng-touched.ng-invalid]:border-error

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
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
        inline-flex items-center gap-2
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
        transition-[background-color,border-color,box-shadow,color] ease-in-out duration-150 motion-reduce:transition-none

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50

        checked:text-primary-foreground
        indeterminate:text-primary-foreground
        indeterminate:bg-primary
        checked:bg-primary

        focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        checked:after:content-['']
        checked:after:absolute
        checked:after:inset-[1px_0_0_1px]
        checked:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%206%209%2017l-5-5'/%3E%3C/svg%3E")]
        checked:after:[mask-repeat:no-repeat]
        checked:after:[mask-size:contain]
        checked:after:bg-current

        indeterminate:after:content-['']
        indeterminate:after:absolute
        indeterminate:after:inset-[1px_0_1px_1px]
        indeterminate:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M5%2012h14'%2F%3E%3C%2Fsvg%3E")]
        indeterminate:after:[mask-repeat:no-repeat]
        indeterminate:after:[mask-size:contain]
        indeterminate:after:bg-current

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
