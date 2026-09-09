import type { MonaCalendarMessages } from "@nanahoshi/mona-ui/i18n";

export const CALENDAR_DEFAULT_MESSAGES: MonaCalendarMessages = {
    calendarLabel: (formattedMonthAndYear: string) => `Calendar, ${formattedMonthAndYear}`,
    yearViewLabel: (year: string) => `Year view, ${year}`,
    decadeViewLabel: (start: number, end: number) => `Decade view, ${start} - ${end}`,
    nextMonth: "Next month",
    nextYear: "Next year",
    nextDecade: "Next decade",
    previousMonth: "Previous month",
    previousYear: "Previous year",
    previousDecade: "Previous decade",
    today: "Today",
    goToToday: (formattedDate: string) => `Go to today, ${formattedDate}`,
    switchToYearView: (currentMonthAndYear: string) => `Switch to year view, currently ${currentMonthAndYear}`,
    switchToDecadeView: (currentYear: string) => `Switch to decade view, currently ${currentYear}`,
    decadeRange: (start: number, end: number) => `${start} to ${end}`,
    yearCellLabel: (year: number) => `Year ${year}`
};
