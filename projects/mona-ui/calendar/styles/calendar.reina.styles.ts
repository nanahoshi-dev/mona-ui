import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarHeaderVariants as monaCalendarHeaderVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
    calendarMonthViewGridVariants as monaCalendarMonthViewGridVariants,
    calendarMonthViewGridHeaderVariants as monaCalendarMonthViewGridHeaderVariants,
    calendarYearViewGridVariants as monaCalendarYearViewGridVariants,
    calendarYearViewCellVariants as monaCalendarYearViewCellVariants,
    calendarDecadeViewGridVariants as monaCalendarDecadeViewGridVariants,
    calendarDecadeViewCellVariants as monaCalendarDecadeViewCellVariants
} from "./calendar.mona.styles";

export const reinaCalendarBaseVariants = createInheritedVariants(monaCalendarBaseVariants, {
    add: "p-3 bg-background/95 backdrop-blur-xl shadow-lg",
    remove: "p-2 bg-background shadow-sm",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        rounded: {
            small: {
                add: "rounded-xl",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-2xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-3xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaCalendarHeaderVariants = createInheritedVariants(monaCalendarHeaderVariants, {});

export const reinaCalendarMonthViewDayVariants = createInheritedVariants(monaCalendarMonthViewDayVariants, {
    add: "hover:bg-accent font-medium transition-colors duration-100 ease-out",
    remove: "hover:bg-hover",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        outside: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        rangePreview: {
            true: {
                add: "bg-primary/15 hover:bg-primary/25",
                remove: "bg-primary/20 hover:bg-primary/30"
            }
        },
        rounded: {
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        },
        selected: {
            true: {
                add: "hover:bg-primary/90",
                remove: "hover:bg-primary-hover"
            }
        }
    }
});

export const reinaCalendarMonthViewGridVariants = createInheritedVariants(monaCalendarMonthViewGridVariants, {});

export const reinaCalendarMonthViewGridHeaderVariants = createInheritedVariants(
    monaCalendarMonthViewGridHeaderVariants,
    {
        add: "text-foreground/50 tracking-tight"
    }
);

export const reinaCalendarYearViewGridVariants = createInheritedVariants(monaCalendarYearViewGridVariants, {});

export const reinaCalendarYearViewCellVariants = createInheritedVariants(monaCalendarYearViewCellVariants, {
    add: "font-medium transition-colors duration-100 ease-out hover:bg-accent active:bg-accent-active",
    remove: "hover:bg-hover active:bg-active",
    variants: {
        rounded: {
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaCalendarDecadeViewGridVariants = createInheritedVariants(monaCalendarDecadeViewGridVariants, {});

export const reinaCalendarDecadeViewCellVariants = createInheritedVariants(monaCalendarDecadeViewCellVariants, {
    add: "font-medium transition-colors duration-100 ease-out hover:bg-accent active:bg-accent-active",
    remove: "hover:bg-hover active:bg-active",
    variants: {
        rounded: {
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        }
    }
});
