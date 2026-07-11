import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarDecadeViewCellVariants as monaCalendarDecadeViewCellVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
    calendarYearViewCellVariants as monaCalendarYearViewCellVariants
} from "./calendar.mona.styles";

export type CalendarBaseVariantProps = VariantProps<typeof monaCalendarBaseVariants>;
export type CalendarMonthViewDayVariantProps = VariantProps<typeof monaCalendarMonthViewDayVariants>;
export type CalendarYearViewCellVariantProps = VariantProps<typeof monaCalendarYearViewCellVariants>;
export type CalendarDecadeViewCellVariantProps = VariantProps<typeof monaCalendarDecadeViewCellVariants>;

export type CalendarVariantProps = CalendarBaseVariantProps &
    CalendarMonthViewDayVariantProps &
    CalendarYearViewCellVariantProps &
    CalendarDecadeViewCellVariantProps;
export type CalendarVariantInput = VariantInputs<
    Pick<CalendarBaseVariantProps, "disabled" | "readonly" | "rounded">
>;

export interface CalendarBaseStyleOverride {
    readonly root?: ClassValue;
    readonly disabled?: Partial<Record<"true", ClassValue>>;
    readonly readonly?: Partial<Record<"true", ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<CalendarBaseVariantProps["rounded"]>, ClassValue>>;
}

export interface CalendarSimpleStyleOverride {
    readonly root?: ClassValue;
}

export interface CalendarMonthViewDayStyleOverride {
    readonly root?: ClassValue;
    readonly disabled?: Partial<Record<"true", ClassValue>>;
    readonly focused?: Partial<Record<"true", ClassValue>>;
    readonly outside?: Partial<Record<"true", ClassValue>>;
    readonly rangePreview?: Partial<Record<"true", ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<CalendarMonthViewDayVariantProps["rounded"]>, ClassValue>>;
    readonly selected?: Partial<Record<"true", ClassValue>>;
    readonly today?: Partial<Record<"true", ClassValue>>;
}

export interface CalendarCellStyleOverride {
    readonly root?: ClassValue;
    readonly focused?: Partial<Record<"true", ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<CalendarYearViewCellVariantProps["rounded"]>, ClassValue>>;
}

export interface CalendarStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: CalendarBaseStyleOverride;
    readonly header?: CalendarSimpleStyleOverride;
    readonly monthViewDay?: CalendarMonthViewDayStyleOverride;
    readonly monthViewGrid?: CalendarSimpleStyleOverride;
    readonly monthViewGridHeader?: CalendarSimpleStyleOverride;
    readonly yearViewGrid?: CalendarSimpleStyleOverride;
    readonly yearViewCell?: CalendarCellStyleOverride;
    readonly decadeViewGrid?: CalendarSimpleStyleOverride;
    readonly decadeViewCell?: CalendarCellStyleOverride;
}

export interface CalendarVariantsBundle {
    readonly base: (props?: CalendarBaseVariantProps) => string;
    readonly header: (props?: object) => string;
    readonly monthViewDay: (props?: CalendarMonthViewDayVariantProps) => string;
    readonly monthViewGrid: () => string;
    readonly monthViewGridHeader: () => string;
    readonly yearViewGrid: () => string;
    readonly yearViewCell: (props?: CalendarYearViewCellVariantProps) => string;
    readonly decadeViewGrid: () => string;
    readonly decadeViewCell: (props?: CalendarDecadeViewCellVariantProps) => string;
}

export type CalendarStyleStrategy = ThemeStrategy<CalendarVariantsBundle>;
export type CalendarStylesProviderConfig = CalendarStyleOverrides | { readonly strategy: CalendarStyleStrategy };
