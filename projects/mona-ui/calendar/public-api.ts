/*
 * Public API Surface of @mirei/mona-ui/calendar
 */

export * from "../src/lib/date-inputs/calendar/components/calendar/calendar.component";
export * from "../src/lib/date-inputs/calendar/directives/calendar-decade-cell-template.directive";
export * from "../src/lib/date-inputs/calendar/directives/calendar-month-cell-template.directive";
export * from "../src/lib/date-inputs/calendar/directives/calendar-year-cell-template.directive";

export type { CalendarSelection } from "../src/lib/date-inputs/calendar/models/CalendarSelection";
export type { FirstDayOfWeek } from "../src/lib/date-inputs/calendar/models/FirstDayOfWeek";
export type {
    DecadeCellTemplateContext,
    MonthCellTemplateContext,
    YearCellTemplateContext
} from "../src/lib/date-inputs/calendar/models/CalendarTemplateContext";
export type { CalendarVariantProps, CalendarVariantInput } from "../src/lib/date-inputs/calendar/styles/calendar.styles";

export type { DateDisabledType } from "../src/lib/date-inputs/models/DateDisabledType";
