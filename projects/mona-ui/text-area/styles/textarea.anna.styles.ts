import { cva } from "class-variance-authority";

export const textAreaVariants = cva(
    `
        px-2 py-1
        text-sm text-foreground
        bg-input-background
        border border-input-border shadow-none
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-150 ease-in-out
        placeholder:text-muted-foreground

        disabled:pointer-events-none disabled:cursor-not-allowed disabled:select-none
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground
        disabled:shadow-none
        read-only:cursor-default

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error
        data-[invalid='true']:focus-visible:border-error
        data-[invalid='true']:focus-visible:ring-error
    `,
    {
        variants: {
            rounded: {
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            }
        }
    }
);
