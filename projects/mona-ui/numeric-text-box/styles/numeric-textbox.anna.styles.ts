import { cva } from "class-variance-authority";

export const numericTextboxVariants = cva(
    `
        flex w-full min-w-0 items-center
        overflow-hidden p-0
        bg-input-background text-foreground
        border border-input-border shadow-none
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-150 ease-in-out
        placeholder:text-muted-foreground

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/35
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
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
            }
        }
    }
);

export const numericTextboxInputVariants = cva(
    `
        h-full w-full
        bg-transparent
        border-0 shadow-none
        rounded-none
        outline-none ring-0
        focus-visible:border-transparent focus-visible:ring-0
    `,
    {
        variants: {
            leftRounded: {
                full: `
                    rounded-tl-full rounded-bl-full
                `,
                large: `
                    rounded-tl-lg rounded-bl-lg
                `,
                medium: `
                    rounded-tl-md rounded-bl-md
                `,
                none: `
                    rounded-tl-none rounded-bl-none
                `,
                small: `
                    rounded-tl-sm rounded-bl-sm
                `
            },
            rightRounded: {
                full: `
                    rounded-tr-full rounded-br-full
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                large: `
                    rounded-tr-lg rounded-br-lg
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                medium: `
                    rounded-tr-md rounded-br-md
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                none: `
                    rounded-tr-none rounded-br-none
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                small: `
                    rounded-tr-sm rounded-br-sm
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `
            }
        }
    }
);

export const numericTextboxButtonVariants = cva(
    `
        flex h-full flex-col
        overflow-y-hidden
        border-s border-border-subtle

        [&>button]:flex [&>button]:flex-1 [&>button]:items-center
        [&>button]:rounded-none [&>button]:p-0
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
            size: {
                large: "w-16 min-w-16",
                medium: "w-8.5 min-w-10",
                small: "w-6.5 min-w-8"
            }
        }
    }
);
