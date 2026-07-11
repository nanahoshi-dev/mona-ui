import { cva } from "class-variance-authority";

export const reinaTextAreaVariants = cva(
    `
        bg-input-background

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground
        font-medium

        transition-[color,box-shadow,border,background-color] ease-out duration-150

        shadow-none
        px-3 py-2 text-sm

        placeholder:text-foreground/40

        disabled:pointer-events-none disabled:opacity-40
        disabled:cursor-not-allowed disabled:select-none

        focus-visible:ring-2 focus-visible:ring-primary/35
        focus-visible:border-primary

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/35
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            rounded: {
                large: "rounded-2xl",
                medium: "rounded-xl",
                none: "rounded-none",
                small: "rounded-lg"
            }
        }
    }
);
