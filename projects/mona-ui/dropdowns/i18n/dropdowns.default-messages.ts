import type { MonaDropdownsMessages } from "@nanahoshi/mona-ui/i18n";

export const DROPDOWNS_DEFAULT_MESSAGES: MonaDropdownsMessages = {
    itemPosition: (text: string, position: number, total: number) => `${text}, ${position} of ${total}`,
    noResultsFound: "No results found",
    resultsAvailable: (count: number) => `${count} result${count === 1 ? "" : "s"} available`
};
