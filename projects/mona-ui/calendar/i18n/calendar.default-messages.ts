// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaCalendarMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const CALENDAR_DEFAULT_MESSAGES: MonaCalendarMessages = {
    calendarLabel: (formattedMonthAndYear: string) => `Calendar, ${formattedMonthAndYear}`,
    decadeRange: (start: number, end: number) =>
        `${localizeNumber(start, { useGrouping: false })} to ${localizeNumber(end, { useGrouping: false })}`,
    decadeViewLabel: (start: number, end: number) =>
        `Decade view, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
    goToToday: (formattedDate: string) => `Go to today, ${formattedDate}`,
    nextDecade: "Next decade",
    nextMonth: "Next month",
    nextYear: "Next year",
    previousDecade: "Previous decade",
    previousMonth: "Previous month",
    previousYear: "Previous year",
    switchToDecadeView: (currentYear: string) => `Switch to decade view, currently ${currentYear}`,
    switchToYearView: (currentMonthAndYear: string) => `Switch to year view, currently ${currentMonthAndYear}`,
    today: "Today",
    yearCellLabel: (year: number) => `Year ${localizeNumber(year, { useGrouping: false })}`,
    yearViewLabel: (year: string) => `Year view, ${year}`
};
