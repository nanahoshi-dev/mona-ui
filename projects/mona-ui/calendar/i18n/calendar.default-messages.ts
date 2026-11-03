import { formatNumber, type MonaCalendarMessages } from "@nanahoshi/mona-ui/i18n";

function localizeYear(year: number): string {
    return formatNumber(year, "en-US", { useGrouping: false });
}

export const CALENDAR_DEFAULT_MESSAGES: MonaCalendarMessages = {
    calendarLabel: (formattedMonthAndYear: string) => `Calendar, ${formattedMonthAndYear}`,
    yearViewLabel: (year: string) => `Year view, ${year}`,
    decadeViewLabel: (start: number, end: number) => `Decade view, ${localizeYear(start)} - ${localizeYear(end)}`,
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
    decadeRange: (start: number, end: number) => `${localizeYear(start)} to ${localizeYear(end)}`,
    yearCellLabel: (year: number) => `Year ${localizeYear(year)}`
};
