import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarDecadeViewCellVariants as monaCalendarDecadeViewCellVariants,
    calendarDecadeViewGridVariants as monaCalendarDecadeViewGridVariants,
    calendarHeaderVariants as monaCalendarHeaderVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
    calendarMonthViewGridHeaderVariants as monaCalendarMonthViewGridHeaderVariants,
    calendarMonthViewGridVariants as monaCalendarMonthViewGridVariants,
    calendarYearViewCellVariants as monaCalendarYearViewCellVariants,
    calendarYearViewGridVariants as monaCalendarYearViewGridVariants
} from "./calendar.mona.styles";
import {
    reinaCalendarBaseVariants,
    reinaCalendarDecadeViewCellVariants,
    reinaCalendarDecadeViewGridVariants,
    reinaCalendarHeaderVariants,
    reinaCalendarMonthViewDayVariants,
    reinaCalendarMonthViewGridHeaderVariants,
    reinaCalendarMonthViewGridVariants,
    reinaCalendarYearViewCellVariants,
    reinaCalendarYearViewGridVariants
} from "./calendar.reina.styles";
import type {
    CalendarBaseVariantProps,
    CalendarDecadeViewCellVariantProps,
    CalendarMonthViewDayVariantProps,
    CalendarStyleOverrides,
    CalendarVariantsBundle,
    CalendarYearViewCellVariantProps
} from "./calendar.types";

function resolveVariantClass(
    classes: Partial<Record<string, ClassValue>> | undefined,
    value: unknown
): ClassValue | undefined {
    if (classes === undefined || value === null || value === undefined) {
        return undefined;
    }
    return classes[String(value)];
}

function activeOverrides(
    overrides: readonly CalendarStyleOverrides[],
    theme: ThemeStyle
): readonly CalendarStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

export function createCalendarVariants(
    baseVariants: typeof monaCalendarBaseVariants,
    headerVariants: typeof monaCalendarHeaderVariants,
    monthViewDayVariants: typeof monaCalendarMonthViewDayVariants,
    monthViewGridVariants: typeof monaCalendarMonthViewGridVariants,
    monthViewGridHeaderVariants: typeof monaCalendarMonthViewGridHeaderVariants,
    yearViewGridVariants: typeof monaCalendarYearViewGridVariants,
    yearViewCellVariants: typeof monaCalendarYearViewCellVariants,
    decadeViewGridVariants: typeof monaCalendarDecadeViewGridVariants,
    decadeViewCellVariants: typeof monaCalendarDecadeViewCellVariants,
    overrides: readonly CalendarStyleOverrides[],
    theme: ThemeStyle
): CalendarVariantsBundle {
    const relevant = activeOverrides(overrides, theme);

    return {
        base: (props: CalendarBaseVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [baseVariants(props)];
            for (const override of relevant) {
                classes.push(override.base?.root);
                classes.push(resolveVariantClass(override.base?.disabled, props.disabled));
                classes.push(resolveVariantClass(override.base?.readonly, props.readonly));
                classes.push(resolveVariantClass(override.base?.rounded, resolvedRounded));
            }
            return twMerge(cx(...classes));
        },
        header: () => {
            const classes: ClassValue[] = [headerVariants({})];
            for (const override of relevant) {
                classes.push(override.header?.root);
            }
            return twMerge(cx(...classes));
        },
        monthViewDay: (props: CalendarMonthViewDayVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [monthViewDayVariants(props)];
            for (const override of relevant) {
                classes.push(override.monthViewDay?.root);
                classes.push(resolveVariantClass(override.monthViewDay?.disabled, props.disabled));
                classes.push(resolveVariantClass(override.monthViewDay?.focused, props.focused));
                classes.push(resolveVariantClass(override.monthViewDay?.outside, props.outside));
                classes.push(resolveVariantClass(override.monthViewDay?.rangePreview, props.rangePreview));
                classes.push(resolveVariantClass(override.monthViewDay?.rounded, resolvedRounded));
                classes.push(resolveVariantClass(override.monthViewDay?.selected, props.selected));
                classes.push(resolveVariantClass(override.monthViewDay?.today, props.today));
            }
            return twMerge(cx(...classes));
        },
        monthViewGrid: () => {
            const classes: ClassValue[] = [monthViewGridVariants()];
            for (const override of relevant) {
                classes.push(override.monthViewGrid?.root);
            }
            return twMerge(cx(...classes));
        },
        monthViewGridHeader: () => {
            const classes: ClassValue[] = [monthViewGridHeaderVariants()];
            for (const override of relevant) {
                classes.push(override.monthViewGridHeader?.root);
            }
            return twMerge(cx(...classes));
        },
        yearViewGrid: () => {
            const classes: ClassValue[] = [yearViewGridVariants()];
            for (const override of relevant) {
                classes.push(override.yearViewGrid?.root);
            }
            return twMerge(cx(...classes));
        },
        yearViewCell: (props: CalendarYearViewCellVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [yearViewCellVariants(props)];
            for (const override of relevant) {
                classes.push(override.yearViewCell?.root);
                classes.push(resolveVariantClass(override.yearViewCell?.focused, props.focused));
                classes.push(resolveVariantClass(override.yearViewCell?.rounded, resolvedRounded));
            }
            return twMerge(cx(...classes));
        },
        decadeViewGrid: () => {
            const classes: ClassValue[] = [decadeViewGridVariants()];
            for (const override of relevant) {
                classes.push(override.decadeViewGrid?.root);
            }
            return twMerge(cx(...classes));
        },
        decadeViewCell: (props: CalendarDecadeViewCellVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [decadeViewCellVariants(props)];
            for (const override of relevant) {
                classes.push(override.decadeViewCell?.root);
                classes.push(resolveVariantClass(override.decadeViewCell?.focused, props.focused));
                classes.push(resolveVariantClass(override.decadeViewCell?.rounded, resolvedRounded));
            }
            return twMerge(cx(...classes));
        }
    };
}

export function createMonaCalendarVariants(
    overrides: readonly CalendarStyleOverrides[],
    theme: ThemeStyle
): CalendarVariantsBundle {
    return createCalendarVariants(
        monaCalendarBaseVariants,
        monaCalendarHeaderVariants,
        monaCalendarMonthViewDayVariants,
        monaCalendarMonthViewGridVariants,
        monaCalendarMonthViewGridHeaderVariants,
        monaCalendarYearViewGridVariants,
        monaCalendarYearViewCellVariants,
        monaCalendarDecadeViewGridVariants,
        monaCalendarDecadeViewCellVariants,
        overrides,
        theme
    );
}

export function createReinaCalendarVariants(
    overrides: readonly CalendarStyleOverrides[],
    theme: ThemeStyle
): CalendarVariantsBundle {
    return createCalendarVariants(
        reinaCalendarBaseVariants,
        reinaCalendarHeaderVariants,
        reinaCalendarMonthViewDayVariants,
        reinaCalendarMonthViewGridVariants,
        reinaCalendarMonthViewGridHeaderVariants,
        reinaCalendarYearViewGridVariants,
        reinaCalendarYearViewCellVariants,
        reinaCalendarDecadeViewGridVariants,
        reinaCalendarDecadeViewCellVariants,
        overrides,
        theme
    );
}
