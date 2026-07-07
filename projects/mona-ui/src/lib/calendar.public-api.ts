/*
 * Public API Surface of @mirei/mona-ui/calendar
 */

export * from "./date-inputs/calendar/components/calendar/calendar.component";
export * from "./date-inputs/calendar/directives/calendar-decade-cell-template.directive";
export * from "./date-inputs/calendar/directives/calendar-month-cell-template.directive";
export * from "./date-inputs/calendar/directives/calendar-year-cell-template.directive";

export type { CalendarSelection } from "./date-inputs/calendar/models/CalendarSelection";
export type { FirstDayOfWeek } from "./date-inputs/calendar/models/FirstDayOfWeek";
export type {
    DecadeCellTemplateContext,
    MonthCellTemplateContext,
    YearCellTemplateContext
} from "./date-inputs/calendar/models/CalendarTemplateContext";
export type { CalendarVariantProps, CalendarVariantInput } from "./date-inputs/calendar/styles/calendar.styles";

export type { DateDisabledType } from "./date-inputs/models/DateDisabledType";
