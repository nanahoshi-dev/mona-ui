import { cva } from "class-variance-authority";

export const calendarBaseVariants = cva(
    `
        flex flex-col gap-2 p-2 min-w-64
        bg-background text-foreground
        border border-input-border
        shadow-sm select-none
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/40
    `,
    {
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none"
            },
            readonly: {
                true: "pointer-events-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const calendarHeaderVariants = cva(
    `
        flex items-center justify-center
        [&>button+button]:not-focus:border-s-0
        [&>button:nth-of-type(2)]:flex-1
        [&>button:nth-of-type(3)]:rounded-se-none
        [&>button:nth-of-type(3)]:rounded-ee-none
        [&>button:nth-of-type(4)]:rounded-ss-none
        [&>button:nth-of-type(4)]:rounded-es-none
        [&>button]:outline-none
    `
);

export const calendarMonthViewDayVariants = cva(
    `
        hover:bg-hover cursor-pointer
    `,
    {
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none"
            },
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            outside: {
                true: "opacity-50"
            },
            rangePreview: {
                true: "bg-primary/20 hover:bg-primary/30"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            selected: {
                true: "bg-primary text-primary-foreground hover:bg-primary-hover"
            },
            today: {
                true: "font-bold text-primary"
            }
        },
        compoundVariants: [
            {
                selected: true,
                today: true,
                class: "text-primary-foreground"
            }
        ],
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const calendarMonthViewGridVariants = cva(
    `
        grid gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:aspect-square
    `
);

export const calendarMonthViewGridHeaderVariants = cva(
    `
        grid justify-center
        gap-0.5 font-semibold text-sm
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:aspect-square
    `
);

export const calendarYearViewGridVariants = cva(
    `
        grid grid-cols-3 gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:h-12
    `
);

export const calendarYearViewCellVariants = cva(
    `
        py-2 cursor-pointer
        hover:bg-hover
        active:bg-active
    `,
    {
        variants: {
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const calendarDecadeViewGridVariants = cva(
    `
        grid grid-cols-4 gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:h-12
    `
);

export const calendarDecadeViewCellVariants = cva(
    `
        py-2 cursor-pointer
        hover:bg-hover
        active:bg-active
    `,
    {
        variants: {
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);
