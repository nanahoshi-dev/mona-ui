/*
 * Public API Surface of @mirei/mona-ui/date-picker
 */

export * from "./date-inputs/date-picker/components/date-picker/date-picker.component";
export * from "./date-inputs/directives/date-input-prefix-template.directive";

export * from "./date-inputs/calendar/directives/calendar-decade-cell-template.directive";
export * from "./date-inputs/calendar/directives/calendar-month-cell-template.directive";
export * from "./date-inputs/calendar/directives/calendar-year-cell-template.directive";
export * from "./dropdowns/directives/dropdown-popup-handler.directive";

export type { FirstDayOfWeek } from "./date-inputs/calendar/models/FirstDayOfWeek";
export type {
    DecadeCellTemplateContext,
    MonthCellTemplateContext,
    YearCellTemplateContext
} from "./date-inputs/calendar/models/CalendarTemplateContext";
export type { DateDisabledType } from "./date-inputs/models/DateDisabledType";
export type {
    DatePickerVariantProps,
    DatePickerVariantInput
} from "./date-inputs/date-picker/styles/date-picker.styles";

export { PopupCloseEvent, PopupCloseSource } from "./popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "./popup/models/PopupCloseEvent";
