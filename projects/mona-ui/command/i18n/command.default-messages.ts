// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaCommandMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const COMMAND_DEFAULT_MESSAGES: MonaCommandMessages = {
    dialogLabel: "Command menu",
    inputLabel: "Search commands",
    listLabel: "Results",
    loading: "Loading",
    noResults: "No results found",
    placeholder: "Type a command or search…",
    resultsAvailable: (count: number) =>
        count === 1 ? `${localizeNumber(count)} result available` : `${localizeNumber(count)} results available`
};
