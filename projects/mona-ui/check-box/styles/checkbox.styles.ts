import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const checkboxInputThemeVariants = cva(`sr-only appearance-none outline-none peer`);

export const checkmarkThemeVariants = cva(
    `
        flex items-center justify-center
        h-4.5 w-4.5 pl-0.25
        cursor-pointer overflow-hidden
        ${themeControlSurfaceClasses}
        border border-input-border
        outline-none

        peer-disabled:pointer-events-none peer-disabled:cursor-not-allowed
        peer-disabled:border-disabled-border peer-disabled:bg-disabled-background peer-disabled:text-disabled-foreground

        peer-checked:border-(--color-selected-border) peer-checked:bg-primary peer-checked:text-primary-foreground
        peer-indeterminate:border-(--color-selected-border) peer-indeterminate:bg-primary peer-indeterminate:text-primary-foreground

        peer-focus-visible:border-focus-indicator
        peer-focus-visible:ring-2 peer-focus-visible:ring-focus-indicator/35

        [&.ng-touched.ng-invalid]:border-error
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:peer-focus-visible:border-error
        data-[invalid='true']:peer-focus-visible:ring-error/35

        peer-indeterminate:after:absolute
        peer-indeterminate:after:inset-[3px_0_3px_0]
        peer-indeterminate:after:content-['']
        peer-indeterminate:after:bg-current
        peer-indeterminate:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M5%2012h14'%2F%3E%3C%2Fsvg%3E")]
        peer-indeterminate:after:[mask-repeat:no-repeat]
        peer-indeterminate:after:[mask-size:contain]
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

export const checkboxContainerLabelThemeVariants = cva(
    `
        relative inline-flex h-full w-full items-center gap-2
        select-none
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
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

export const checkboxDirectiveThemeVariants = cva(
    `
        relative h-4.5 w-4.5
        cursor-pointer appearance-none
        ${themeControlSurfaceClasses}
        border border-input-border
        outline-none

        disabled:pointer-events-none disabled:cursor-not-allowed
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground

        checked:border-(--color-selected-border) checked:bg-primary checked:text-primary-foreground
        indeterminate:border-(--color-selected-border) indeterminate:bg-primary indeterminate:text-primary-foreground

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        checked:after:absolute
        checked:after:inset-[1px_0_0_1px]
        checked:after:content-['']
        checked:after:bg-current
        checked:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%206%209%2017l-5-5'/%3E%3C/svg%3E")]
        checked:after:[mask-repeat:no-repeat]
        checked:after:[mask-size:contain]

        indeterminate:after:absolute
        indeterminate:after:inset-[1px_0_1px_1px]
        indeterminate:after:content-['']
        indeterminate:after:bg-current
        indeterminate:after:[mask-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23FFFFFF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M5%2012h14'%2F%3E%3C%2Fsvg%3E")]
        indeterminate:after:[mask-repeat:no-repeat]
        indeterminate:after:[mask-size:contain]

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error/35
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error/35
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

export type CheckboxVariantProps = VariantProps<typeof checkboxContainerLabelThemeVariants>;

export type CheckboxVariantInput = VariantInputs<CheckboxVariantProps>;

export type CheckmarkVariantProps = VariantProps<typeof checkmarkThemeVariants>;

export type CheckmarkVariantInput = VariantInputs<CheckmarkVariantProps>;

export type CheckboxDirectiveVariantProps = VariantProps<typeof checkboxDirectiveThemeVariants>;

export type CheckboxDirectiveVariantInput = VariantInputs<CheckboxDirectiveVariantProps>;
