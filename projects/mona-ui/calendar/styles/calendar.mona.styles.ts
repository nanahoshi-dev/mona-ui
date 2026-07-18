import { cva } from "class-variance-authority";

export const calendarBaseVariants = cva(
    `
        flex min-w-64 flex-col gap-2 p-2
        select-none
        bg-surface-raised text-foreground
        border border-border shadow-xs
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-50"
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
        cursor-pointer
        hover:bg-hover active:bg-active
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground"
            },
            focused: {
                true: "bg-hover outline-none ring-2 ring-inset ring-focus-indicator/35"
            },
            outside: {
                true: "text-muted-foreground"
            },
            rangePreview: {
                true: "bg-active hover:bg-active"
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
                true: "font-bold text-foreground"
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
        grid justify-center gap-0.5
        [&>div]:aspect-square
        [&>div]:flex [&>div]:h-full
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarMonthViewGridHeaderVariants = cva(
    `
        grid justify-center gap-0.5
        text-sm font-semibold text-muted-foreground
        [&>div]:aspect-square
        [&>div]:flex [&>div]:h-full
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarYearViewGridVariants = cva(
    `
        grid grid-cols-3 justify-center gap-0.5
        [&>div]:flex [&>div]:h-12
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarYearViewCellVariants = cva(
    `
        cursor-pointer py-2
        hover:bg-hover active:bg-active
    `,
    {
        variants: {
            focused: {
                true: "bg-hover outline-none ring-2 ring-inset ring-focus-indicator/35"
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
        grid grid-cols-4 justify-center gap-0.5
        [&>div]:flex [&>div]:h-12
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarDecadeViewCellVariants = cva(
    `
        cursor-pointer py-2
        hover:bg-hover active:bg-active
    `,
    {
        variants: {
            focused: {
                true: "bg-hover outline-none ring-2 ring-inset ring-focus-indicator/35"
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
