// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaDropdownsMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const DROPDOWNS_DEFAULT_MESSAGES: MonaDropdownsMessages = {
    itemPosition: (text: string, position: number, total: number) =>
        `${text}, ${localizeNumber(position)} of ${localizeNumber(total)}`,
    noResultsFound: "No results found",
    resultsAvailable: (count: number) =>
        count === 1 ? `${localizeNumber(count)} result available` : `${localizeNumber(count)} results available`
};
