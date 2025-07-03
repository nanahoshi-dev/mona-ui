import { cva } from "class-variance-authority";

export const switchVariants = cva(
    `
        relative flex items-center cursor-pointer select-none
        transition-[background]

        bg-input-background
        border border-input-border
        outline-none

        focus-within:ring-2 focus-within:ring-primary/40

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:opacity-50

        data-[active='true']:bg-primary
        data-[active='true']:text-primary-foreground

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
            },
            size: {
                large: "w-14 h-7.5 text-md",
                medium: "w-12 h-6.5 text-sm",
                small: "w-10 h-5.5 text-xs"
            }
        }
    }
);

export const switchHandleVariants = cva(
    `
        absolute inline-flex
        items-center justify-center
        outline-none transition-[left,background] ease-in-out duration-300
        border border-border bg-secondary
        data-[active='true']:bg-background
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                large: `
                    w-6 h-6
                    data-[active='true']:left-[calc(100%-26px)]
                    data-[active='false']:left-0.5
                `,
                medium: `
                    w-5 h-5
                    data-[active='true']:left-[calc(100%-22px)]
                    data-[active='false']:left-0.5
                `,
                small: `
                    w-4 h-4
                    data-[active='true']:left-[calc(100%-18px)]
                    data-[active='false']:left-0.5
                `
            }
        }
    }
);

export const switchLabelVariants = cva(
    `
        h-full flex flex-1 items-center justify-center text-xs
    `
);
