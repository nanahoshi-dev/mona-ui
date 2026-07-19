import { cva } from "class-variance-authority";
import { themeRaisedBackdropClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const calendarBaseThemeVariants = cva(
    `
        flex min-w-64 flex-col gap-2 p-2
        select-none
        bg-(--mona-calendar-background) ${themeRaisedBackdropClasses} text-foreground
        border border-border shadow-(--mona-calendar-shadow)
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

export const calendarHeaderThemeVariants = cva(
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

export const calendarMonthViewDayThemeVariants = cva(
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

export const calendarMonthViewGridThemeVariants = cva(
    `
        grid justify-center gap-0.5
        [&>div]:aspect-square
        [&>div]:flex [&>div]:h-full
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarMonthViewGridHeaderThemeVariants = cva(
    `
        grid justify-center gap-0.5
        text-sm font-semibold text-muted-foreground
        [&>div]:aspect-square
        [&>div]:flex [&>div]:h-full
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarYearViewGridThemeVariants = cva(
    `
        grid grid-cols-3 justify-center gap-0.5
        [&>div]:flex [&>div]:h-12
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarYearViewCellThemeVariants = cva(
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

export const calendarDecadeViewGridThemeVariants = cva(
    `
        grid grid-cols-4 justify-center gap-0.5
        [&>div]:flex [&>div]:h-12
        [&>div]:items-center [&>div]:justify-center
    `
);

export const calendarDecadeViewCellThemeVariants = cva(
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

type CalendarBaseVariantProps = VariantProps<typeof calendarBaseThemeVariants>;

type CalendarBaseVariantInput = VariantInputs<CalendarBaseVariantProps>;

type CalendarHeaderVariantProps = VariantProps<typeof calendarHeaderThemeVariants>;

type CalendarHeaderVariantInput = VariantInputs<CalendarHeaderVariantProps>;

type CalendarDecadeViewGridVariantProps = VariantProps<typeof calendarDecadeViewGridThemeVariants>;

type CalendarDecadeViewGridVariantInput = VariantInputs<CalendarDecadeViewGridVariantProps>;

type CalendarDecadeViewCellVariantProps = VariantProps<typeof calendarDecadeViewCellThemeVariants>;

type CalendarDecadeViewCellVariantInput = VariantInputs<CalendarDecadeViewCellVariantProps>;

type CalendarMonthViewDayVariantProps = VariantProps<typeof calendarMonthViewDayThemeVariants>;

type CalendarMonthViewDayVariantInput = VariantInputs<CalendarMonthViewDayVariantProps>;

type CalendarMonthViewGridVariantProps = VariantProps<typeof calendarMonthViewGridThemeVariants>;

type CalendarMonthViewGridVariantInput = VariantInputs<CalendarMonthViewGridVariantProps>;

type CalendarMonthViewGridHeaderVariantProps = VariantProps<typeof calendarMonthViewGridHeaderThemeVariants>;

type CalendarMonthViewGridHeaderVariantInput = VariantInputs<CalendarMonthViewGridHeaderVariantProps>;

type CalendarYearViewGridVariantProps = VariantProps<typeof calendarYearViewGridThemeVariants>;

type CalendarYearViewGridVariantInput = VariantInputs<CalendarYearViewGridVariantProps>;

type CalendarYearViewCellVariantProps = VariantProps<typeof calendarYearViewCellThemeVariants>;

type CalendarYearViewCellVariantInput = VariantInputs<CalendarYearViewCellVariantProps>;

export type CalendarVariantProps = CalendarBaseVariantProps &
    CalendarHeaderVariantProps &
    CalendarDecadeViewGridVariantProps &
    CalendarDecadeViewCellVariantProps &
    CalendarMonthViewDayVariantProps &
    CalendarMonthViewGridVariantProps &
    CalendarMonthViewGridHeaderVariantProps &
    CalendarYearViewGridVariantProps &
    CalendarYearViewCellVariantProps;

export type CalendarVariantInput = CalendarBaseVariantInput &
    CalendarHeaderVariantInput &
    CalendarDecadeViewGridVariantInput &
    Omit<CalendarDecadeViewCellVariantInput, "focused"> &
    Omit<CalendarMonthViewDayVariantInput, "disabled" | "focused" | "outside" | "rangePreview" | "selected" | "today"> &
    CalendarMonthViewGridVariantInput &
    CalendarMonthViewGridHeaderVariantInput &
    CalendarYearViewGridVariantInput &
    Omit<CalendarYearViewCellVariantInput, "focused">;
