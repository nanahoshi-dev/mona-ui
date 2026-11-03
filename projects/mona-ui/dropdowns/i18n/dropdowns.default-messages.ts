import { formatNumber, type MonaDropdownsMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number): string {
    return formatNumber(value, "en-US");
}

export const DROPDOWNS_DEFAULT_MESSAGES: MonaDropdownsMessages = {
    itemPosition: (text: string, position: number, total: number) =>
        `${text}, ${localizeNumber(position)} of ${localizeNumber(total)}`,
    noResultsFound: "No results found",
    resultsAvailable: (count: number) => `${localizeNumber(count)} result${count === 1 ? "" : "s"} available`
};
