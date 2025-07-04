import { cva } from "class-variance-authority";

export const numericTextboxVariants = cva(
    `
        flex items-center w-full min-w-0
        bg-transparent
        border border-input-border p-0
        outline-none

        placeholder:text-muted-foreground

        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] ease-in-out duration-300

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/40

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
                large: "h-11.5",
                medium: "h-8.75",
                small: "h-8.25"
            }
        }
    }
);

export const numericTextboxInputVariants = cva(
    `
        border-0 outline-none ring-0
        h-full w-full
        focus-visible:ring-0 shadow-none
        rounded-none
    `,
    {
        variants: {
            rounded: {
                full: "rounded-tl-full rounded-bl-full",
                large: "rounded-tl-lg rounded-bl-lg",
                medium: "rounded-tl-md rounded-bl-md",
                none: "rounded-none",
                small: "rounded-tl-sm rounded-bl-sm"
            }
        }
    }
);

export const numericTextboxButtonVariants = cva(
    `
        h-full flex flex-col border-l border-input-border
        overflow-y-hidden
        [&>button]:flex-1
        [&>button]:flex
        [&>button]:items-center
        [&>button]:p-0
        [&>button]:rounded-none

        [&>button]:first:rounded-tl-none
        [&>button]:first:rounded-bl-none
        [&>button]:first:rounded-br-none
        [&>button]:first:h-1/2
        [&>button]:last:rounded-tl-none
        [&>button]:last:rounded-bl-none
        [&>button]:last:rounded-tr-none
        [&>button]:last:h-1/2
    `,
    {
        variants: {
            rounded: {
                full: "[&>button]:rounded-tr-full [&>button]:rounded-br-full",
                large: "[&>button]:rounded-tr-lg [&>button]:rounded-br-lg",
                medium: "[&>button]:rounded-tr-md [&>button]:rounded-br-md",
                none: "[&>button]:rounded-none",
                small: "[&>button]:rounded-tr-sm [&>button]:rounded-br-sm"
            },
            size: {
                large: "min-w-16 w-16",
                medium: "min-w-10 w-10",
                small: "min-w-8 w-8"
            }
        }
    }
);
