export interface MonaCalendarMessages {
    calendarLabel(formattedMonthAndYear: string): string;
    decadeRange(start: number, end: number): string;
    decadeViewLabel(start: number, end: number): string;
    goToToday(formattedDate: string): string;
    readonly nextDecade: string;
    readonly nextMonth: string;
    readonly nextYear: string;
    readonly previousDecade: string;
    readonly previousMonth: string;
    readonly previousYear: string;
    switchToDecadeView(currentYear: string): string;
    switchToYearView(currentMonthAndYear: string): string;
    readonly today: string;
    yearCellLabel(year: number): string;
    yearViewLabel(year: string): string;
}

export type CalendarMessages = MonaCalendarMessages;
