/*
 * Public API Surface of @nanahoshi/mona-ui/calendar
 */

export * from "./components/calendar/calendar.component";
export * from "./directives/calendar-decade-cell-template.directive";
export * from "./directives/calendar-month-cell-template.directive";
export * from "./directives/calendar-year-cell-template.directive";

export type { CalendarSelection } from "./models/CalendarSelection";
export type { FirstDayOfWeek } from "./models/FirstDayOfWeek";
export type {
    DecadeCellTemplateContext,
    MonthCellTemplateContext,
    YearCellTemplateContext
} from "./models/CalendarTemplateContext";
export {
    CALENDAR_STYLE_OVERRIDES,
    CALENDAR_STYLE_STRATEGY,
    calendarThemeVariants,
    createCalendarStyleStrategy,
    provideCalendarStyles
} from "./styles/calendar.styles";
export type {
    CalendarBaseStyleOverride,
    CalendarBaseVariantProps,
    CalendarCellStyleOverride,
    CalendarDecadeViewCellVariantProps,
    CalendarMonthViewDayStyleOverride,
    CalendarMonthViewDayVariantProps,
    CalendarSimpleStyleOverride,
    CalendarStyleOverrides,
    CalendarStylesProviderConfig,
    CalendarStyleStrategy,
    CalendarVariantInput,
    CalendarVariantProps,
    CalendarVariantsBundle,
    CalendarYearViewCellVariantProps
} from "./styles/calendar.styles";
