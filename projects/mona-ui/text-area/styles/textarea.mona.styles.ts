import { cva } from "class-variance-authority";

export const textAreaVariants = cva(
    `
        bg-input-background

        border border-border-control outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none

        shadow-control
        px-3 py-1.5 text-sm

        placeholder:text-muted-foreground

        focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        disabled:pointer-events-none
        disabled:bg-disabled-background
        disabled:opacity-50
        disabled:text-disabled
        disabled:border-border-subtle
        disabled:cursor-not-allowed
        disabled:select-none

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error/35
        [&.ng-touched.ng-invalid]:focus-visible:border-error [&.ng-touched.ng-invalid]:focus-visible:ring-error/35
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-visible:border-error data-[invalid='true']:focus-visible:ring-error/35
    `,
    {
        variants: {
            rounded: {
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);
