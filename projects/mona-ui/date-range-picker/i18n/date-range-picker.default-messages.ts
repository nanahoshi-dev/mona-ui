// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaDateRangePickerMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

const PLURAL_RULES = new Intl.PluralRules("en-US");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const DATE_RANGE_PICKER_DEFAULT_MESSAGES: MonaDateRangePickerMessages = {
    dateRangePicker: "Date range picker",
    end: "End date",
    lastDays: (count: number) =>
        `Last ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} day`, other: () => `${localizeNumber(count)} days` })}`,
    lastMonth: "Last month",
    lastWeek: "Last week",
    lastYear: "Last year",
    openCalendar: "Open calendar",
    presets: "Quick ranges",
    start: "Start date",
    thisMonth: "This month",
    thisWeek: "This week",
    thisYear: "This year",
    today: "Today",
    yesterday: "Yesterday"
};
