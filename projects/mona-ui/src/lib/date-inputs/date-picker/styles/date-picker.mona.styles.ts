import { cva } from "class-variance-authority";

export const datePickerBaseVariants = cva(
    `
        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/40
    `,
    {
        variants: {
            focused: {
                true: `
                [&_mona-text-box]:ring-2
                [&_mona-text-box]:ring-primary/40
                [&_mona-text-box]:border-primary

            `,
                false: ""
            }
        }
    }
);
